const { pool } = require('./lib/db.js');
async function run() {
  try {
    await pool.query('ALTER TABLE enquiries ADD COLUMN whatsapp_number varchar(15) DEFAULT NULL;');
    console.log('Success');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('Already exists');
    else console.error(e);
  }
  process.exit();
}
run();
