const http = require('http');
http.get('http://localhost:3000/api/calendar?month=2026-09', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => console.log('Error: ' + err.message));
