import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { logActivity } from '@/lib/activity';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    
    // Get basic user info
    const [userRows] = await pool.query('SELECT user_id, user_name as name, email, mobile, role, status, image, added_date, updated_date FROM user_master WHERE user_id = ?', [id]);
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userRows[0];

    // Get assigned enquiries
    const [enquiries] = await pool.query('SELECT * FROM enquiries WHERE assigned_to = ? ORDER BY added_date DESC', [id]);
    
    // Get activity logs
    const [activities] = await pool.query('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC', [id]);

    return NextResponse.json({ user, enquiries, activities });
  } catch (err) {
    console.error('Fetch user detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch user context' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, mobile, role, status, image, password } = body;

    if (password && password.trim() !== '') {
      await pool.query(
        'UPDATE user_master SET user_name = ?, email = ?, mobile = ?, role = ?, status = ?, image = ?, password = ? WHERE user_id = ?',
        [name, email, mobile, role, status, image || null, password, id]
      );
    } else {
      await pool.query(
        'UPDATE user_master SET user_name = ?, email = ?, mobile = ?, role = ?, status = ?, image = ? WHERE user_id = ?',
        [name, email, mobile, role, status, image || null, id]
      );
    }

    await logActivity({
      req,
      action: 'Update User',
      module: 'User Management',
      recordId: id,
      description: `Updated details for user ${name || email}`
    });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
