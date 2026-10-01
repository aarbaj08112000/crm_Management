import mysql from 'mysql2/promise';

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  const [scheduled] = await conn.query('SELECT * FROM scheduled_emails ORDER BY id DESC LIMIT 2');
  console.log("Scheduled Emails:", scheduled);
  
  if (scheduled.length > 0) {
    const eId = scheduled[0].enquiry_id;
    const [enq] = await conn.query('SELECT enquiry_id, name, msg_sent FROM enquiries WHERE enquiry_id = ?', [eId]);
    console.log("Enquiry:", enq);
  }
  process.exit(0);
}
test();
