const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root@12345678',
    database: process.env.DB_NAME || 'enquiry_db',
  });

  try {
    const [rows] = await connection.query(
      `SELECT se.*, u.user_name as created_by_name, e.name as lead_name
       FROM scheduled_emails se
       LEFT JOIN user_master u ON se.created_by = u.user_id
       LEFT JOIN enquiries e ON se.enquiry_id = e.enquiry_id
       ORDER BY se.scheduled_at DESC`
    );
    console.log(JSON.stringify(rows));
  } catch (err) {
    console.error(err);
  }
  await connection.end();
}
run();
