// server.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const path = require('path');

const { pool } = require('./db/pool');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// قيمة افتراضية مضمونة (من غير أي اتصال بالداتابيز) عشان أي صفحة تقدر تتعرض،
// حتى لو فشل أي حاجة قبل كدا (زي الـ session store)، من غير ما تعمل كراش تاني جوه صفحة الخطأ نفسها
app.use((req, res, next) => {
  res.locals.programName = process.env.PROGRAM_NAME || 'برنامج البرمجة للأطفال';
  res.locals.programTagline =
    'برنامج أونلاين بالكامل لتعليم البرمجة والتفكير الحاسوبي للأطفال من 8 إلى 16 سنة';
  next();
});

// الجدول اتعمل من قبل (عن طريق migrate أو أول مرة اشتغل السيرفر)،
// فـ createTableIfMissing لازم تبقى false دلوقتي؛ لو سبتها true هتحاول
// تعمل الجدول/الـ primary key تاني في كل مرة السيرفر يشتغل (زي كل Cold Start
// في Replit Autoscale)، وده بيرمي "relation session_pkey already exists"
// وبيوقع السيرفر كله - وده بالظبط اللي كان بيحصل.
const sessionStore = new pgSession({ pool, tableName: 'program_sessions', createTableIfMissing: false });
// شبكة أمان: أي خطأ تاني في الـ session store يتسجل بس من غير ما يوقع السيرفر
sessionStore.on('error', (err) => {
  console.error('⚠️ Session store error (متجاهله عشان السيرفر يفضل شغال):', err.message);
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'insecure-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // أسبوع
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// متاح في كل الـ views
app.use(async (req, res, next) => {
  res.locals.session = req.session;
  res.locals.currentPath = req.path;
  try {
    const { rows } = await pool.query(
      `SELECT key, value FROM program_settings WHERE key IN ('program_name', 'program_tagline')`
    );
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.locals.programName = map.program_name || process.env.PROGRAM_NAME || 'برنامج البرمجة للأطفال';
    res.locals.programTagline =
      map.program_tagline || 'برنامج أونلاين بالكامل لتعليم البرمجة والتفكير الحاسوبي للأطفال من 8 إلى 16 سنة';
  } catch (e) {
    res.locals.programName = process.env.PROGRAM_NAME || 'برنامج البرمجة للأطفال';
    res.locals.programTagline = 'برنامج أونلاين بالكامل لتعليم البرمجة والتفكير الحاسوبي للأطفال من 8 إلى 16 سنة';
  }
  next();
});

// لازم يكون public دايمًا ومن غير أي جلسة، عشان الـ health check بتاع الاستضافة يرد بسرعة
app.get('/health', (req, res) => res.status(200).send('ok'));

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: 'الصفحة مش موجودة', message: '' });
});

// معالج أخطاء عام - بيمنع أي خطأ إنه يوقف السيرفر أو "يعلق" الطلب
app.use((err, req, res, next) => {
  console.error('❌', err);
  if (res.headersSent) return next(err);
  res.status(500).render('error', {
    title: 'حصلت مشكلة',
    message: process.env.NODE_ENV === 'development' ? err.message : 'حاول تاني بعد شوية، ولو المشكلة استمرت كلم الأدمن.',
  });
});

async function ensureAdminUser() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.warn('⚠️ ADMIN_USERNAME/ADMIN_PASSWORD مش متظبطين في .env - مش هينشئ حساب أدمن تلقائي.');
    return;
  }
  const { rows } = await pool.query(`SELECT id FROM program_admins WHERE username = $1`, [username]);
  if (rows.length > 0) return;
  const hash = await bcrypt.hash(password, 10);
  await pool.query(`INSERT INTO program_admins (username, password_hash) VALUES ($1, $2)`, [username, hash]);
  console.log(`✅ اتعمل حساب أدمن: ${username}`);
}

async function start() {
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout (8s)')), 8000)),
    ]);
    console.log('✅ الاتصال بقاعدة البيانات شغال.');
  } catch (err) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
    console.error('راجع DATABASE_URL في متغيرات البيئة (في Replit لازم تكون في Deployment secrets).');
  }

  try {
    await ensureAdminUser();
  } catch (err) {
    console.error('⚠️ مشكلة في إنشاء حساب الأدمن التلقائي:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على بورت ${PORT}`);
  });
}

start();

module.exports = app;
