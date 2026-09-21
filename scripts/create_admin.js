// scripts/create_admin.js
// بيعمل حساب أدمن جديد (أو يحدّث الباسورد لو الاسم موجود بالفعل).
// استخدام: node scripts/create_admin.js <username> <password>
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.log('استخدام: node scripts/create_admin.js <username> <password>');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(`SELECT id FROM program_admins WHERE username = $1`, [username]);
  if (rows.length > 0) {
    await pool.query(`UPDATE program_admins SET password_hash = $1 WHERE username = $2`, [hash, username]);
    console.log(`✅ اتحدث الباسورد بتاع "${username}".`);
  } else {
    await pool.query(`INSERT INTO program_admins (username, password_hash) VALUES ($1, $2)`, [username, hash]);
    console.log(`✅ اتعمل حساب أدمن جديد: "${username}"`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
