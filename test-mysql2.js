const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'Root@12345678', database: 'enquiry_db' });
  const str = '[{"filename":"test"}]';
  const arr = [{"filename":"test"}];
  await db.query("INSERT INTO email_logs (user_id, recipient_email, subject, direction, attachments) VALUES (1, 'a@b.com', 'test', 'sent', ?)", [str]);
  await db.query("INSERT INTO email_logs (user_id, recipient_email, subject, direction, attachments) VALUES (1, 'a@b.com', 'test', 'sent', ?)", [arr]);
  console.log('Inserted');
  db.end();
}
run().catch(console.error);
