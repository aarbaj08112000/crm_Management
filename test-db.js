const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  const [scheduled] = await db.execute("SELECT body, text_body FROM scheduled_emails WHERE id=2");
  const [emaillog] = await db.execute("SELECT body FROM email_logs WHERE id=160");
  console.log("SCHEDULED BODY:", scheduled[0].body);
  console.log("SCHEDULED TEXT_BODY:", scheduled[0].text_body);
  console.log("EMAILLOG BODY:", emaillog[0].body);
  console.log("ARE THEY EXACTLY EQUAL?", scheduled[0].body === emaillog[0].body);
  db.end();
}
run();
