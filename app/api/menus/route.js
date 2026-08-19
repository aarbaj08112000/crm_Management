import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    await jwtVerify(token, JWT_SECRET);

    const [menus] = await pool.query('SELECT * FROM menus ORDER BY sequence ASC');
    return NextResponse.json({ menus });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ menus: [], error: error.message }, { status: 500 });
  }
}
