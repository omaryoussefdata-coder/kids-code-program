// routes/public.js
const express = require('express');
const { pool } = require('../db/pool');
const { GOVERNORATES, EGYPT_PHONE_REGEX, MIN_AGE, MAX_AGE } = require('../utils/constants');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    governorates: GOVERNORATES,
    minAge: MIN_AGE,
    maxAge: MAX_AGE,
    errors: {},
    values: {},
  });
});

router.post('/apply', async (req, res, next) => {
  try {
    const fullName = String(req.body.full_name || '').trim().replace(/\s+/g, ' ');
    const age = parseInt(req.body.age, 10);
    const governorate = String(req.body.governorate || '').trim();
    const studentPhone = String(req.body.student_phone || '').trim();
    const guardianPhone = String(req.body.guardian_phone || '').trim();
    const whatsappConfirmed = req.body.whatsapp_confirmed === 'on' || req.body.whatsapp_confirmed === 'true';
    const termsAcknowledged = req.body.terms_acknowledged === 'on' || req.body.terms_acknowledged === 'true';

    const nameParts = fullName.split(' ').filter(Boolean);
    const errors = {};

    if (nameParts.length < 4) {
      errors.full_name = 'لازم تكتب الاسم رباعي كامل (4 كلمات على الأقل): اسم الطفل + اسم الأب + اسم الجد + اسم العائلة.';
    }
    if (!Number.isFinite(age) || age < MIN_AGE || age > MAX_AGE) {
      errors.age = `السن لازم يكون من ${MIN_AGE} لحد ${MAX_AGE} سنة.`;
    }
    if (!governorate || !GOVERNORATES.includes(governorate)) {
      errors.governorate = 'اختار المحافظة من القايمة.';
    }
    if (!EGYPT_PHONE_REGEX.test(studentPhone)) {
      errors.student_phone = 'رقم موبايل صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015).';
    }
    if (!EGYPT_PHONE_REGEX.test(guardianPhone)) {
      errors.guardian_phone = 'رقم موبايل صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015).';
    }
    if (!whatsappConfirmed) {
      errors.whatsapp_confirmed = 'لازم تأكد إن الرقم ده عليه واتساب شغال، عشان التواصل هيكون من خلاله.';
    }
    if (!termsAcknowledged) {
      errors.terms_acknowledged = 'لازم توافق على الشروط دي قبل ما تقدر تسجل.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render('index', {
        governorates: GOVERNORATES,
        minAge: MIN_AGE,
        maxAge: MAX_AGE,
        errors,
        values: {
          full_name: fullName,
          age: req.body.age,
          governorate,
          student_phone: studentPhone,
          guardian_phone: guardianPhone,
          whatsapp_confirmed: whatsappConfirmed,
          terms_acknowledged: termsAcknowledged,
        },
      });
    }

    await pool.query(
      `INSERT INTO program_applications
         (full_name, age, governorate, student_phone, guardian_phone, whatsapp_confirmed, terms_acknowledged)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [fullName, age, governorate, studentPhone, guardianPhone, whatsappConfirmed, termsAcknowledged]
    );

    res.render('thank-you', { fullName });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
