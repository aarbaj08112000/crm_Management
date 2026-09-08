import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Root@12345678',
    database: process.env.MYSQL_DATABASE || 'enquiry_db'
  });

  try {
    const sqlPath = path.join(__dirname, 'twilio_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons, ignoring empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.startsWith('--') && statement.split('\n').length === 1) continue;
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await connection.query(statement);
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

runMigration();
