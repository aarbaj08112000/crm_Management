import mysql from 'mysql2/promise';

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  const [rows] = await conn.query('SELECT enquiry_id, name, msg_sent FROM enquiries WHERE enquiry_id = 20');
  console.log("msg_sent length:", rows[0].msg_sent.length);
  console.log("msg_sent chars:", rows[0].msg_sent.split('').map(c => c.charCodeAt(0)));
  process.exit(0);
}
test();
