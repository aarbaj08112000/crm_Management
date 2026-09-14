const { pool } = require('./lib/db');
async function run() {
  const [rows] = await pool.query("DESCRIBE call_logs");
  console.log(rows);
  process.exit();
}
run();
