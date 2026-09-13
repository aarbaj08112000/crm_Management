const http = require('http');

async function run() {
  // We can't easily guess password if we don't know it, but we can bypass or create a token manually using jsonwebtoken.
  // Wait, I can check if jsonwebtoken is installed.
  const pkg = require('./package.json');
  console.log('Dependencies:', Object.keys(pkg.dependencies).filter(k => k.includes('jwt') || k.includes('jose')));
}
run();
