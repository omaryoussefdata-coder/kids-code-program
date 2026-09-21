// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const STATUS_LABELS = {
  new: 'جديد',
  contacted: 'تم التواصل',
  enrolled: 'مسجل',
  rejected: 'مرفوض',
};

// ---------- Login (مفيش تسجيل ذاتي - أدمن واحد بس بيتعمل من متغيرات البيئة) ----------
router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const { rows } = await pool.query(`SELECT * FROM program_admins WHERE username = $1`, [username]);
    const admin = rows[0];
    const ok = admin && (await bcrypt.compare(password, admin.password_hash));

    if (!ok) {
      return res.status(401).render('admin/login', { error: 'اسم المستخدم أو الباسورد غلط.' });
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAdmin);

// ---------- Dashboard ----------
router.get('/', async (req, res, next) => {
  try {
    const statusFilter = String(req.query.status || '').trim();
    const search = String(req.query.q || '').trim();

    const conditions = [];
    const params = [];

    if (statusFilter && Object.keys(STATUS_LABELS).includes(statusFilter)) {
      params.push(statusFilter);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(full_name ILIKE $${idx} OR student_phone ILIKE $${idx} OR guardian_phone ILIKE $${idx})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: applications } = await pool.query(
      `SELECT * FROM program_applications ${whereClause} ORDER BY created_at DESC LIMIT 1000`,
      params
    );

    const { rows: statsRows } = await pool.query(
      `SELECT status, COUNT(*)::int AS c FROM program_applications GROUP BY status`
    );
    const stats = { new: 0, contacted: 0, enrolled: 0, rejected: 0 };
    statsRows.forEach((r) => { stats[r.status] = r.c; });
    stats.total = Object.values(stats).reduce((a, b) => a + b, 0);

    res.render('admin/dashboard', {
      applications,
      stats,
      statusLabels: STATUS_LABELS,
      statusFilter,
      search,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/applications/:id/status', async (req, res, next) => {
  try {
    const status = String(req.body.status || '');
    if (!Object.keys(STATUS_LABELS).includes(status)) {
      return res.status(400).render('error', { title: 'حالة غير صحيحة', message: '' });
    }
    await pool.query(`UPDATE program_applications SET status = $1 WHERE id = $2`, [status, req.params.id]);
    res.redirect(req.get('Referer') || '/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/applications/:id/notes', async (req, res, next) => {
  try {
    const notes = String(req.body.admin_notes || '');
    await pool.query(`UPDATE program_applications SET admin_notes = $1 WHERE id = $2`, [notes, req.params.id]);
    res.redirect(req.get('Referer') || '/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/applications/:id/delete', async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM program_applications WHERE id = $1`, [req.params.id]);
    res.redirect(req.get('Referer') || '/admin');
  } catch (err) {
    next(err);
  }
});

// ---------- CSV export ----------
router.get('/export.csv', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM program_applications ORDER BY created_at DESC`);
    const header = [
      'id', 'full_name', 'age', 'governorate', 'student_phone', 'guardian_phone',
      'whatsapp_confirmed', 'status', 'admin_notes', 'created_at',
    ];
    const escapeCsv = (val) => {
      const s = val === null || val === undefined ? '' : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(',')];
    rows.forEach((r) => {
      lines.push(header.map((h) => escapeCsv(r[h])).join(','));
    });
    const csv = '﻿' + lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="applications-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ---------- Settings ----------
router.get('/settings', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT key, value FROM program_settings`);
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.render('admin/settings', { settings, saved: false });
  } catch (err) {
    next(err);
  }
});

router.post('/settings', async (req, res, next) => {
  try {
    const programName = String(req.body.program_name || '').trim() || 'برنامج البرمجة للأطفال';
    const programTagline = String(req.body.program_tagline || '').trim();

    await pool.query(
      `INSERT INTO program_settings (key, value) VALUES ('program_name', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [programName]
    );
    await pool.query(
      `INSERT INTO program_settings (key, value) VALUES ('program_tagline', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [programTagline]
    );

    const { rows } = await pool.query(`SELECT key, value FROM program_settings`);
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.render('admin/settings', { settings, saved: true });
  } catch (err) {
    next(err);
  }
});

router.use((req, res) => {
  res.status(404).render('error', { title: 'الصفحة مش موجودة', message: '' });
});

module.exports = router;
