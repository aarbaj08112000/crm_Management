import pkg from './lib/db.js';
const { pool } = pkg;
async function check() {
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
