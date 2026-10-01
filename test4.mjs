import mysql from 'mysql2/promise';

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  
  // Create test enquiry
  const [res] = await conn.query("INSERT INTO enquiries (name, msg_sent) VALUES ('Test Enquiry', 'No')");
  const enquiryId = res.insertId;
  console.log("Created enquiry", enquiryId);
  
  // Run the EXACT code from route.js
  const parsedEnquiryId = enquiryId;
  if (parsedEnquiryId) {
    const [existingEnquiry] = await conn.query('SELECT msg_sent FROM enquiries WHERE enquiry_id = ?', [parsedEnquiryId]);
    if (existingEnquiry.length > 0) {
      await conn.query('UPDATE enquiries SET msg_sent = ? WHERE enquiry_id = ?', ['Scheduled Email', parsedEnquiryId]);
    }
  }
  
  // Verify
  const [verify] = await conn.query("SELECT msg_sent FROM enquiries WHERE enquiry_id = ?", [enquiryId]);
  console.log("Verified msg_sent:", verify[0].msg_sent);
  
  process.exit(0);
}
test();
