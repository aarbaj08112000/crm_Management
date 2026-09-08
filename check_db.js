const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [users] = await pool.query('SELECT user_id, username, role, role_id FROM user_master');
    console.log('Users:', users);
    const [roles] = await pool.query('SELECT * FROM roles');
    console.log('Roles:', roles);
    const [perms] = await pool.query('SELECT * FROM role_permissions');
    console.log('Perms:', perms);
    const [menus] = await pool.query('SELECT * FROM menus');
    console.log('Menus:', menus);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
