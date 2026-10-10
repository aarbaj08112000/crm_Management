const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function query() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'u875583157_crm',
  });
  
  const [rows] = await pool.query(`SELECT * FROM enquiry_details WHERE Customer_Name LIKE '%Test Enquiry%'`);
  console.log(rows);
  process.exit();
}
query();
