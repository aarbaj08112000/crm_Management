import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crm_management'
});

async function run() {
  const [rows] = await pool.query('SELECT event_type, event_data, created_at FROM call_events ORDER BY id DESC LIMIT 10');
  rows.forEach(r => {
    console.log(r.event_type, r.created_at);
    const data = JSON.parse(r.event_data);
    console.log(`  Leg: ${data.direction} | Status: ${data.status} | uuid: ${data.uuid}`);
  });
  process.exit(0);
}
run();
