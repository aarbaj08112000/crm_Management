import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    const [permissions] = await pool.query(
      `SELECT p.can_view
       FROM role_permissions p
       JOIN menus m ON p.menu_id = m.id
       JOIN user_master u ON u.role_id = p.role_id
       WHERE u.user_id = ? AND m.path = '/call-pitches'`,
      [userId]
    );

    if (permissions.length === 0 || !permissions[0].can_view) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const [rows] = await pool.query('SELECT * FROM call_pitches WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Call pitch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Fetch call pitch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    const [permissions] = await pool.query(
      `SELECT p.can_update
       FROM role_permissions p
       JOIN menus m ON p.menu_id = m.id
       JOIN user_master u ON u.role_id = p.role_id
       WHERE u.user_id = ? AND m.path = '/call-pitches'`,
      [userId]
    );

    if (permissions.length === 0 || !permissions[0].can_update) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to update call pitches.' }, { status: 403 });
    }

    const { id } = params;
    const data = await request.json();
    const { title, description, category, status, script_body, key_talking_points, target_audience, language } = data;

    await pool.query(
      `UPDATE call_pitches SET 
        title = ?, description = ?, category = ?, status = ?, script_body = ?, 
        key_talking_points = ?, target_audience = ?, language = ?, updated_by = ?
      WHERE id = ?`,
      [
        title, description, category, status, script_body, 
        JSON.stringify(key_talking_points || []), target_audience, language, userId, 
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update call pitch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;

    const [permissions] = await pool.query(
      `SELECT p.can_delete
       FROM role_permissions p
       JOIN menus m ON p.menu_id = m.id
       JOIN user_master u ON u.role_id = p.role_id
       WHERE u.user_id = ? AND m.path = '/call-pitches'`,
      [userId]
    );

    if (permissions.length === 0 || !permissions[0].can_delete) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to delete call pitches.' }, { status: 403 });
    }

    const { id } = params;
    
    await pool.query('DELETE FROM call_pitches WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete call pitch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
