import http from 'http';
import mysql from 'mysql2/promise';

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@12345678',
    database: 'enquiry_db'
  });
  
  // Set Millennium Industry msg_sent to 'No'
  await conn.query("UPDATE enquiries SET msg_sent = 'No' WHERE enquiry_id = 20");
  
  // Manually hit the GET /api/enquiries endpoint (simulate frontend fetch)
  const req = http.request('http://localhost:3000/api/enquiries?page=1&limit=10&_t=' + Date.now(), {
    headers: {
      'Cookie': 'token=ey...' // wait, we don't have a valid token easily without DB
    }
  });
  
  // Just query the DB directly to see if the UPDATE from my script works
  // And let's call the actual POST API to schedule an email
}
