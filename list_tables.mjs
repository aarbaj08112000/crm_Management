import mysql from 'mysql2/promise';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2];
  return acc;
}, {});

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      port: env.DB_PORT || 3306,
    });
    const [rows] = await conn.query('SHOW TABLES');
    console.log(rows);
    await conn.end();
  } catch (e) { console.error(e); }
  process.exit();
}
run();
