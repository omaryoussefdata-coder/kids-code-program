// db/pool.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString || '');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

pool.on('error', (err) => {
  console.error('❌ خطأ غير متوقع في اتصال قاعدة البيانات:', err.message);
});

module.exports = { pool };
