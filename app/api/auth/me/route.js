import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Fetch latest user info and permissions
    const { pool } = await import('@/lib/db');
    const [users] = await pool.query('SELECT role_id, role FROM user_master WHERE user_id = ?', [payload.userId]);
    
    let permissions = [];
    let userRole = payload.role;

    if (users.length > 0) {
      const user = users[0];
      userRole = user.role;
      if (user.role_id) {
        const [perms] = await pool.query(
          `SELECT p.*, m.name as menu_name, m.path as menu_path, m.icon as menu_icon, m.group_name as menu_group, m.sequence
           FROM role_permissions p 
           JOIN menus m ON p.menu_id = m.id 
           WHERE p.role_id = ? AND m.status = 'Active' ORDER BY m.sequence ASC`,
          [user.role_id]
        );
        permissions = perms;
      }
    }

    return NextResponse.json({ 
      user: { ...payload, role: userRole },
      permissions
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
