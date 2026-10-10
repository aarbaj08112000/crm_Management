import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity';
import { fetchAndSyncEmails } from '@/lib/imap';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // --- DEBUG: DB Connection Test ---
    try {
      const debugUser = await query('SELECT * FROM user_master LIMIT 1');
      console.log('--- DB TEST CONNECTION ---');
      console.log('Found user in DB:', debugUser);
    } catch (dbError) {
      console.error('--- DB TEST CONNECTION FAILED ---', dbError.message);
    }
    // ---------------------------------

    const users = await query('SELECT * FROM user_master WHERE email = ? OR user_name = ?', [email, email]);
    
    if (users.length === 0) {
      console.log('Login failed: User not found for email:', email);
      return NextResponse.json({ error: 'Invalid credentials (User not found)' }, { status: 401 });
    }

    const user = users[0];
    
    // Check password (handling both plain text and bcrypt for flexibility)
    let isMatch = false;
    if (user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      console.log('Login failed: Password mismatch for user:', email);
      return NextResponse.json({ error: 'Invalid credentials (Password incorrect)' }, { status: 401 });
    }

    const token = await new SignJWT({ userId: user.user_id, email: user.email, name: user.user_name, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    await logActivity({
      userId: user.user_id,
      action: 'Login',
      module: 'Auth',
      description: `User ${user.user_name} logged in.`
    });

    const response = NextResponse.json({ message: 'Login successful', user: { id: user.user_id, name: user.user_name, role: user.role } });
    
    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false, // Changed to false for EC2 HTTP login
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    // Fire background sync without awaiting it
    Promise.resolve().then(() => {
      console.log('[Login] Triggering background email sync...');
      fetchAndSyncEmails().catch(err => console.error('[Login] Background sync failed:', err));
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
