import mysql from 'mysql2/promise';

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  const [rows] = await conn.query('SELECT enquiry_id, name, msg_sent FROM enquiries ORDER BY enquiry_id DESC LIMIT 5');
  console.log(rows);
  process.exit(0);
}
test();
