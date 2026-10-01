const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Root@12345678', database: 'enquiry_db' });
  const month = '2026-09';
  let whereClause = "1=1 AND DATE_FORMAT(scheduled_date, '%Y-%m') = ?";
  const query = `
      SELECT 
        p.id, 
        DATE_FORMAT(p.scheduled_date, '%Y-%m-%d') as scheduled_date, 
        DATE_FORMAT(p.scheduled_time, '%H:%i') as scheduled_time, 
        p.activity_type, 
        'planned' as source_table
      FROM planned_activities p
      WHERE ${whereClause}

      UNION ALL

      SELECT 
        c.id, 
        DATE_FORMAT(c.created_at, '%Y-%m-%d') as scheduled_date, 
        DATE_FORMAT(c.created_at, '%H:%i') as scheduled_time, 
        'Call Log' as activity_type, 
        'log' as source_table
      FROM call_logs c
      WHERE ${whereClause.replace(/scheduled_date/g, 'DATE(c.created_at)')}
      
      ORDER BY scheduled_date ASC, scheduled_time ASC
  `;
  try {
      const [rows] = await pool.query(query, [month, month]);
      console.log(rows.filter(r => r.scheduled_date === '2026-09-19'));
  } catch(e) {
      console.log("Error:", e.message);
  }
  process.exit(0);
}
test();
