const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Root@12345678',
      database: 'enquiry_db'
    });
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        place_id VARCHAR(255) UNIQUE,
        cid VARCHAR(255),
        title VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        address TEXT,
        is_lead TINYINT DEFAULT 0,
        added_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('ai_contacts table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
