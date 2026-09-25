import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    const [permissions] = await pool.query(
      `SELECT p.can_view, u.role
       FROM role_permissions p
       JOIN menus m ON p.menu_id = m.id
       JOIN user_master u ON u.role_id = p.role_id
       WHERE u.user_id = ? AND m.path = '/call-pitches'`,
      [userId]
    );

    if (permissions.length === 0 || !permissions[0].can_view) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.query('SELECT * FROM call_pitches ORDER BY added_date DESC');

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch call pitches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    const [permissions] = await pool.query(
      `SELECT p.can_add
       FROM role_permissions p
       JOIN menus m ON p.menu_id = m.id
       JOIN user_master u ON u.role_id = p.role_id
       WHERE u.user_id = ? AND m.path = '/call-pitches'`,
      [userId]
    );

    if (permissions.length === 0 || !permissions[0].can_add) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to add call pitches.' }, { status: 403 });
    }

    const data = await request.json();
    const { title, description, category, status, script_body, key_talking_points, target_audience, language } = data;

    if (!title || !script_body) {
      return NextResponse.json({ error: 'Title and Script Body are required' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO call_pitches (
        title, description, category, status, script_body, key_talking_points, target_audience, language, added_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        description || '', 
        category || 'General', 
        status || 'Draft', 
        script_body, 
        JSON.stringify(key_talking_points || []), 
        target_audience || '', 
        language || 'EN', 
        userId
      ]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Create call pitch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
