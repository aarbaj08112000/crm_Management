import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@12345678',
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
};

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('Creating roles table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating menus table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_name VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        icon VARCHAR(255),
        sequence INT DEFAULT 0,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating role_permissions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        menu_id INT NOT NULL,
        can_view BOOLEAN DEFAULT false,
        can_add BOOLEAN DEFAULT false,
        can_update BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        UNIQUE KEY role_menu (role_id, menu_id)
      )
    `);

    console.log('Adding role_id to user_master...');
    try {
      await connection.execute(`
        ALTER TABLE user_master ADD COLUMN role_id INT DEFAULT NULL;
      `);
      await connection.execute(`
        ALTER TABLE user_master ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
      `);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('role_id already exists in user_master');
      } else {
        console.error('Error altering user_master:', e.message);
      }
    }

    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
