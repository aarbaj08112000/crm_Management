import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@12345678',
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
};

async function update() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [res] = await connection.execute(
      'INSERT IGNORE INTO menus (group_name, name, path, icon, sequence) VALUES (?, ?, ?, ?, ?)',
      ['SYSTEM', 'Roles & Permissions', '/roles', 'Shield', 9]
    );
    
    // get admin role id
    const [roles] = await connection.execute('SELECT id FROM roles WHERE name = "Admin"');
    if (roles.length > 0) {
      const adminId = roles[0].id;
      // get the new menu id
      const [menus] = await connection.execute('SELECT id FROM menus WHERE name = "Roles & Permissions"');
      if (menus.length > 0) {
        const menuId = menus[0].id;
        await connection.execute(
          'INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete) VALUES (?, ?, true, true, true, true)',
          [adminId, menuId]
        );
      }
    }
    console.log("Menu added");
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}
update();
