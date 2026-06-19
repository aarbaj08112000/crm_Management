const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Root@12345678',
      database: 'enquiry_db'
    });
    
    // Check if body column exists, if not, add it
    await connection.execute(`
      ALTER TABLE email_logs ADD COLUMN body TEXT NULL
    `).catch(err => {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        throw err;
      }
    });

    console.log('Migration successful');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
