const https = require('https');

const apiUser = 'bca821-f5ade1-85d7e2-c28d02-f74c08';
const apiPass = '6e7d66-afa96f-c29cae-5e8c41-220dec';
const basicAuth = Buffer.from(`${apiUser}:${apiPass}`).toString('base64');

const postData = 'member_name=TestUser&member_num=9999999999&access=2&active=1';

const options = {
  hostname: 'indiavoice.rpdigitalphone.com',
  path: '/api_v3/addmember_v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${basicAuth}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', body);
  });
});

req.on('error', console.error);
req.write(postData);
req.end();
