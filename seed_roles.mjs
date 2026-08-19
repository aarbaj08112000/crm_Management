import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@12345678',
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
};

const navigation = [
  { group: 'MAIN', name: 'Dashboard', path: '/', icon: 'LayoutDashboard', sequence: 1 },
  { group: 'MANAGEMENT', name: 'Add Enquiry', path: '/add', icon: 'UserPlus', sequence: 2 },
  { group: 'MANAGEMENT', name: 'Enquiry List', path: '/list', icon: 'ListOrdered', sequence: 3 },
  { group: 'COMMUNICATION', name: 'WhatsApp Chat', path: '/whatsapp', icon: 'MessageSquare', sequence: 4 },
  { group: 'COMMUNICATION', name: 'Email Logs', path: '/email-logs', icon: 'Mail', sequence: 5 },
  { group: 'SYSTEM', name: 'Users', path: '/users', icon: 'Users', sequence: 6 },
  { group: 'SYSTEM', name: 'AI Lead Scraper', path: '/scrape', icon: 'Bot', sequence: 7 },
  { group: 'SYSTEM', name: 'Contacts', path: '/contacts', icon: 'ClipboardList', sequence: 8 },
];

const roles = [
  { name: 'Admin', description: 'Administrator with full access' },
  { name: 'Sales', description: 'Sales agent' },
  { name: 'Manager', description: 'Manager' },
];

async function seed() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    // 1. Seed Roles
    console.log('Seeding roles...');
    for (const role of roles) {
      await connection.execute(
        'INSERT IGNORE INTO roles (name, description) VALUES (?, ?)',
        [role.name, role.description]
      );
    }

    // Fetch inserted role IDs
    const [roleRows] = await connection.execute('SELECT id, name FROM roles');
    const roleMap = {};
    roleRows.forEach(r => roleMap[r.name.toLowerCase()] = r.id);

    // 2. Seed Menus
    console.log('Seeding menus...');
    for (const menu of navigation) {
      await connection.execute(
        'INSERT IGNORE INTO menus (group_name, name, path, icon, sequence) VALUES (?, ?, ?, ?, ?)',
        [menu.group, menu.name, menu.path, menu.icon, menu.sequence]
      );
    }

    // Fetch inserted menu IDs
    const [menuRows] = await connection.execute('SELECT id, name FROM menus');
    const menuMap = {};
    menuRows.forEach(m => menuMap[m.name] = m.id);

    // 3. Seed Permissions (Admin gets everything)
    console.log('Seeding permissions...');
    const adminRoleId = roleMap['admin'];
    if (adminRoleId) {
      for (const menu of menuRows) {
        await connection.execute(
          `INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete) 
           VALUES (?, ?, true, true, true, true)`,
          [adminRoleId, menu.id]
        );
      }
    }

    // Update existing users to map to their new role_id based on string role
    console.log('Updating user role IDs...');
    const [users] = await connection.execute('SELECT user_id, role FROM user_master WHERE role IS NOT NULL');
    for (const user of users) {
      const userRoleLower = user.role.toLowerCase();
      const roleId = roleMap[userRoleLower];
      if (roleId) {
        await connection.execute('UPDATE user_master SET role_id = ? WHERE user_id = ?', [roleId, user.user_id]);
      }
    }

    console.log('Seeding successful!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await connection.end();
  }
}

seed();
