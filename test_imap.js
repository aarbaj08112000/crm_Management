const { ImapFlow } = require('imapflow');
const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  });

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  const [rows] = await connection.execute('SELECT * FROM email_accounts WHERE is_default = 1');
  const defaultAccount = rows[0];
  console.log('Account:', defaultAccount ? defaultAccount.email : 'None');

  if (defaultAccount) {
    console.log('Access token starts with:', defaultAccount.access_token.substring(0, 10));
    console.log('Refresh token starts with:', defaultAccount.refresh_token.substring(0, 10));

    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: defaultAccount.email,
        accessToken: defaultAccount.access_token
      },
      logger: false
    });

    try {
      await client.connect();
      console.log('IMAP Connect Success!');
      await client.logout();
    } catch (e) {
      console.error('IMAP Connect Failed:', e.message);
      if (e.message.includes('Invalid credentials') || e.message.includes('Authentication failed')) {
        console.log('Token expired! Testing refresh...');
        const { OAuth2Client } = require('google-auth-library');
        const oAuth2Client = new OAuth2Client(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
          'http://localhost:3000/api/auth/google/callback'
        );
        oAuth2Client.setCredentials({ refresh_token: defaultAccount.refresh_token });
        const res = await oAuth2Client.getAccessToken();
        console.log('New Access Token:', res.token ? 'Success' : 'Failed');
      }
    }
  }

  await connection.end();
}

run();
