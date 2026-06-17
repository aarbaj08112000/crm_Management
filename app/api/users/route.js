import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT user_id, user_name as name, email, role, status, image FROM user_master');
    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, mobile, password, role, image, status } = body;

    const [result] = await pool.query(
      'INSERT INTO user_master (user_name, email, mobile, password, role, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, mobile, password, role || 'user', status !== undefined ? status : 1, image || null]
    );

    await logActivity({
      req,
      action: 'Create User',
      module: 'User Management',
      recordId: result.insertId,
      description: `Created new user ${name || email}`
    });

    return NextResponse.json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
