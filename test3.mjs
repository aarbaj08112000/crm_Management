import mysql from 'mysql2/promise';

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  await conn.query('UPDATE enquiries SET msg_sent = ? WHERE enquiry_id = 20', ['Scheduled Email']);
  const [enq] = await conn.query('SELECT msg_sent FROM enquiries WHERE enquiry_id = 20');
  console.log("Updated msg_sent:", enq[0].msg_sent);
  process.exit(0);
}
test();
