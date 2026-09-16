import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userId;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based access check
    const permissions = await query(
      `SELECT p.can_view, u.role
       FROM role_permissions p
       JOIN menus m ON p.menu_id = m.id
       JOIN user_master u ON u.role_id = p.role_id
       WHERE u.user_id = ? AND m.path = '/scheduled-emails'`,
      [userId]
    );

    if (permissions.length === 0 || !permissions[0].can_view) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userRole = (permissions[0].role || '').toString().toLowerCase();
    let emailsQuery = `SELECT se.*, u.user_name as created_by_name, e.name as lead_name
       FROM scheduled_emails se
       LEFT JOIN user_master u ON se.created_by = u.user_id
       LEFT JOIN enquiries e ON se.enquiry_id = e.enquiry_id`;
    
    const queryParams = [];
    if (userRole !== 'admin') {
      emailsQuery += ` WHERE se.created_by = ?`;
      queryParams.push(userId);
    }
    
    emailsQuery += ` ORDER BY se.scheduled_at DESC`;

    const emails = await query(emailsQuery, queryParams);

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Failed to fetch scheduled emails:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled emails' }, { status: 500 });
  }
}
