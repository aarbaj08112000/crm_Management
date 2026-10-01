const mysql = require('mysql2/promise');
require('dotenv').config();
async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Root@12345678', database: 'enquiry_db' });
  const [rows] = await pool.query("SELECT DATE(created_at) as scheduled_date, TIME(created_at) as scheduled_time FROM call_logs LIMIT 1");
  console.log(rows);
  process.exit(0);
}
test();
