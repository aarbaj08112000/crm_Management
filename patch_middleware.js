const fs = require('fs');
let middlewareCode = fs.readFileSync('middleware.js', 'utf8');
if (!middlewareCode.includes("pathname.startsWith('/socket.io')")) {
  middlewareCode = middlewareCode.replace("pathname.startsWith('/_next') ||", "pathname.startsWith('/_next') ||\n    pathname.startsWith('/socket.io') ||");
  fs.writeFileSync('middleware.js', middlewareCode);
  console.log("Patched middleware.js");
}
