const fs = require('fs');

// 1. Patch server.js to use default path (remove path: '/api/socket')
let serverCode = fs.readFileSync('server.js', 'utf8');
serverCode = serverCode.replace("path: '/api/socket',", "");
fs.writeFileSync('server.js', serverCode);

// 2. Patch page.jsx to use default path
let pageCode = fs.readFileSync('app/whatsapp-web/page.jsx', 'utf8');
pageCode = pageCode.replace("const socket = io({ path: '/api/socket' });", "const socket = io();");
fs.writeFileSync('app/whatsapp-web/page.jsx', pageCode);

console.log("Patched server.js and page.jsx");
