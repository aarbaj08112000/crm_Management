const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/scheduled-emails',
  method: 'GET',
  headers: {
    'Cookie': 'token=' + require('child_process').execSync(`node -e "const { SignJWT } = require('jose'); const secret = new TextEncoder().encode('your-secret-key'); new SignJWT({ userId: 1, role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).sign(secret).then(console.log);"`).toString().trim()
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.end();
