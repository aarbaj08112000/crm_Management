import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Note: Using user_name instead of name to match existing schema
    const [rows] = await pool.query('SELECT user_id, user_name as name, email, role FROM user_master WHERE status = 1');
    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
