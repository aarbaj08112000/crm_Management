const mysql = require('mysql2/promise');

async function checkEmails() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  const [rows] = await connection.execute('SELECT id, subject, is_read, direction, enquiry_id, sent_at FROM email_logs WHERE enquiry_id = 9 ORDER BY id DESC LIMIT 10');
  console.log(rows);
  await connection.end();
}

checkEmails();
