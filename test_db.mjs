import { pool } from './lib/db.js';
async function run() {
  try {
    const [rows] = await pool.query("DESCRIBE call_logs");
    console.log(rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
