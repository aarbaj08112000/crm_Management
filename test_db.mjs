import mysql from 'mysql2/promise';

async function testConnection() {
  console.log('=========================================');
  console.log('Attempting to connect to Hostinger DB...');
  console.log('Host: auth-db1493.hstgr.io');
  console.log('User: u875583157_crm');
  console.log('=========================================');

  try {
    const connection = await mysql.createConnection({
      host: '193.203.184.96',
      user: 'u875583157_crm',
      password: 'CodeCrafter@032022',
      database: 'u875583157_crm',
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
