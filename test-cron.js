const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'Root@12345678', database: 'enquiry_db' });
  const atts = [{"filename":"test.txt", "path":"/uploads/emails/test.txt", "size":12}];
  await db.query("INSERT INTO scheduled_emails (enquiry_id, `to`, subject, body, attachments, scheduled_at, status, created_by) VALUES (NULL, 'test@example.com', 'Test Cron', 'Body', ?, NOW(), 'Pending', 1)", [JSON.stringify(atts)]);
  console.log('Inserted scheduled email');
  db.end();
}
run().catch(console.error);
