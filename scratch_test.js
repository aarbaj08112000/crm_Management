const http = require('http');

const data = JSON.stringify({
  name: "Test Update",
  email: "test@update.com",
  mobile: "1234567890",
  role: "user",
  status: 1,
  sip_username: "08485835691",
  sip_password: "dpQLCZxL"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users/2',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
