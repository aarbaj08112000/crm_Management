const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_Management',
  });
  const [rows] = await connection.execute("DESCRIBE whatsapp_contacts");
  console.log(rows);
  
  // also add enquiry_id if it doesn't exist
  const hasEnquiryId = rows.some(r => r.Field === 'enquiry_id');
  if (!hasEnquiryId) {
    await connection.execute("ALTER TABLE whatsapp_contacts ADD COLUMN enquiry_id VARCHAR(50) DEFAULT NULL");
    console.log("Added enquiry_id column");
  }
  
  connection.end();
}
check();
