const mysql = require('mysql2/promise');
require('dotenv').config();
async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Root@12345678', database: 'enquiry_db' });
  const month = '2026-09';
  let whereClause = "1=1 AND DATE_FORMAT(scheduled_date, '%Y-%m') = ?";
  let queryParams = [month];
  
  const query = `
      SELECT p.id FROM planned_activities p WHERE ${whereClause}
      UNION ALL
      SELECT c.id FROM call_logs c WHERE ${whereClause.replace(/scheduled_date/g, 'DATE(c.created_at)')}
  `;
  try {
      const [rows] = await pool.query(query, queryParams);
      console.log("Success:", rows);
  } catch(e) {
      console.log("Error:", e.message);
  }
  process.exit(0);
}
test();
