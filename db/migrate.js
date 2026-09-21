// db/migrate.js
// بيشغل schema.sql على قاعدة البيانات المتصلة بيها في DATABASE_URL
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('⏳ بنجهز الجداول...');
  try {
    await pool.query(sql);
    console.log('✅ تمام، الجداول اتعملت/موجودة بالفعل.');
  } catch (err) {
    console.error('❌ فشل تجهيز الجداول:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
