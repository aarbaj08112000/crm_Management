import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@12345678',
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute("SHOW COLUMNS FROM ai_contacts LIKE 'is_fake'");
    console.log("Column is_fake exists:", rows.length > 0);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}
check();
