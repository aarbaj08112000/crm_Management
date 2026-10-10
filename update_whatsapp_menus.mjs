import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || '193.203.184.96', // Defaulting to the true Hostinger IP you discovered
  user: process.env.MYSQL_USER || 'u875583157_crm',
  password: process.env.MYSQL_PASSWORD || 'CodeCrafter@032022',
  database: process.env.MYSQL_DATABASE || 'u875583157_crm',
};

async function update() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    // 1. Add WhatsApp RP Menu
    await connection.execute(
      'INSERT IGNORE INTO menus (group_name, name, path, icon, sequence, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['COMMUNICATION', 'WhatsApp RP', '/whatsapp-rp', 'MessageCircle', 4, 'Active']
    );

    // 2. Add WhatsApp Web Menu
    await connection.execute(
      'INSERT IGNORE INTO menus (group_name, name, path, icon, sequence, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['COMMUNICATION', 'WhatsApp Web', '/whatsapp-web', 'MonitorSmartphone', 5, 'Active']
    );
    
    // get admin role id
    const [roles] = await connection.execute('SELECT id FROM roles WHERE name = "Admin"');
    if (roles.length > 0) {
      const adminId = roles[0].id;
      
      // Grant permissions for WhatsApp RP
      const [rpMenus] = await connection.execute('SELECT id FROM menus WHERE name = "WhatsApp RP"');
      if (rpMenus.length > 0) {
        await connection.execute(
          'INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete) VALUES (?, ?, true, true, true, true)',
          [adminId, rpMenus[0].id]
        );
      }

      // Grant permissions for WhatsApp Web
      const [webMenus] = await connection.execute('SELECT id FROM menus WHERE name = "WhatsApp Web"');
      if (webMenus.length > 0) {
        await connection.execute(
          'INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete) VALUES (?, ?, true, true, true, true)',
          [adminId, webMenus[0].id]
        );
      }
    }
    console.log("✅ WhatsApp RP and WhatsApp Web Menus + Permissions added successfully!");
  } catch (err) {
    console.error("❌ Failed to update menus:", err);
  } finally {
    await connection.end();
  }
}
update();
