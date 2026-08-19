import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@12345678',
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
};

async function test() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute("DESCRIBE ai_contacts");
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}
test();
