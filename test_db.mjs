import { pool } from './lib/db.js';
async function check() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log(rows);
    const [cols] = await pool.query('DESCRIBE activity_logs');
    console.log(cols);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
check();
