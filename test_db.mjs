import mysql from 'mysql2/promise';

async function testConnection() {
 

  try {
    const connection = await mysql.createConnection({
      host: '',
      user: '',
      password: '',
      database: '',
      connectTimeout: 10000 // 10 seconds timeout
    });

    console.log('\n✅ DATABASE CONNECTED SUCCESSFULLY!');

    console.log('\nRunning test query...');
    const [rows] = await connection.execute('SELECT * FROM user_master LIMIT 1');
    console.log('✅ QUERY SUCCESSFUL!');
    if (rows.length > 0) {
      console.log(`Found User: ID=${rows[0].user_id}, Email=${rows[0].email}`);
    } else {
      console.log('User table is empty!');
    }

    await connection.end();
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error('-----------------------------------------');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);

    if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 HINT: Hostinger is blocking the EC2 IP. Make sure the Elastic IP is whitelisted in Hostinger Remote MySQL (or try using % for all IPs temporarily).');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 HINT: The username or password is incorrect, or Hostinger is actively rejecting this IP.');
    }
    console.log('-----------------------------------------');
  }
}

testConnection();
