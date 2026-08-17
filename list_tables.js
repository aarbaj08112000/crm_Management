const { db } = require('./lib/db.js');
async function run() {
  try {
    const [rows] = await db.query('SHOW TABLES');
    console.log(rows);
  } catch (e) { console.error(e); }
  process.exit();
}
run();
