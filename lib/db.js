import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@123',
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Prevent multiple pools in development due to HMR
let pool;
if (process.env.NODE_ENV === 'production') {
  pool = mysql.createPool(dbConfig);
} else {
  if (!global.mysqlPool) {
    global.mysqlPool = mysql.createPool(dbConfig);
  }
  pool = global.mysqlPool;
}

export { pool };

export async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
