// db/pool.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString || '');

// تشخيص بس - بيطبع مين هوست الداتابيز اللي بيتصل بيه (من غير باسورد) عشان
// نقدر نتأكد إنه فعلاً واصل لـ Supabase مش لحاجة تانية، بدون ما نطبع أي بيانات حساسة
if (!connectionString) {
  console.warn('⚠️ DATABASE_URL مش موجودة خالص في الـ environment دي.');
} else {
  try {
    const u = new URL(connectionString);
    // مهم: بوّاب Supabase (Session/Transaction Pooler) بيوجهك لمشروع مختلف حسب
    // اسم المستخدم (postgres.xxxxxxx) مش حسب الـ host بس - فلازم نطبعه عشان
    // نتأكد إن Shell والـ Deployment شغالين على نفس المشروع بالظبط
    console.log(`ℹ️ الداتابيز هيتصل بـ host: ${u.hostname} | user: ${u.username} | db name: ${u.pathname.replace('/', '')}`);
  } catch (e) {
    console.warn('⚠️ DATABASE_URL موجودة بس شكلها مش رابط صحيح.');
  }
}

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

pool.on('error', (err) => {
  console.error('❌ خطأ غير متوقع في اتصال قاعدة البيانات:', err.message);
});

module.exports = { pool };
