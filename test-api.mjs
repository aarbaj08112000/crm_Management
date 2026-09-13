import * as jose from 'jose';

async function test() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
  const token = await new jose.SignJWT({ userId: 1, roleId: 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);
  
  const res = await fetch('http://localhost:3000/api/scheduled-emails', {
    headers: {
      Cookie: `token=${token}`
    }
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}
test();
