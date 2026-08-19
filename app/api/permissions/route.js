import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get('role_id');

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    await jwtVerify(token, JWT_SECRET);

    const [permissions] = await pool.query(
      `SELECT p.*, m.name as menu_name, m.group_name as menu_group 
       FROM role_permissions p 
       JOIN menus m ON p.menu_id = m.id 
       WHERE p.role_id = ?`,
      [roleId]
    );

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ permissions: [], error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { roleId, permissions } = await req.json();

    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing permissions for this role
      await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

      // Insert new permissions
      if (permissions.length > 0) {
        const values = [];
        const placeholders = [];
        for (const p of permissions) {
          placeholders.push('(?, ?, ?, ?, ?, ?)');
          values.push(roleId, p.menu_id, p.can_view ? 1 : 0, p.can_add ? 1 : 0, p.can_update ? 1 : 0, p.can_delete ? 1 : 0);
        }

        const sql = `INSERT INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete) VALUES ${placeholders.join(', ')}`;
        await connection.execute(sql, values);
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Permissions updated successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
