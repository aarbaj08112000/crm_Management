import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get user info from token
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;
    const role = (payload.role || '').toString().toLowerCase();

    console.log(`[API] User: ${userId}, Role: ${role}, assignedTo: ${assignedTo}`);

    let sql = `
      SELECT e.*, u.user_name as assignee_name 
      FROM enquiries e
      LEFT JOIN user_master u ON e.assigned_to = u.user_id
      WHERE (e.name LIKE ? OR e.mobile_number LIKE ?)
    `;
    const params = [`%${search}%`, `%${search}%`];

    // Role-based visibility logic: 
    // - Admin: Can see everything and use filters.
    // - Sales & others: Strictly restricted to their own assigned enquiries.
    if (role === 'admin') {
      if (assignedTo === 'only_assigned') {
        sql += ' AND e.assigned_to IS NOT NULL';
      } else if (assignedTo === 'unassigned') {
        sql += ' AND (e.assigned_to IS NULL OR e.assigned_to = 0)';
      } else if (assignedTo) {
        sql += ' AND e.assigned_to = ?';
        params.push(assignedTo);
      }
    } else {
      // For Sales role and any other non-admin roles, force filter by their userId
      sql += " AND e.assigned_to = ?";
      params.push(userId);
    }

    if (type) {
      sql += ' AND e.type LIKE ?';
      params.push(`%${type}%`);
    }

    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }

    sql += ` ORDER BY e.added_date DESC LIMIT ${limit} OFFSET ${offset}`;

    const [enquiries] = await pool.query(sql, params);
    
    let countSql = 'SELECT COUNT(*) as total FROM enquiries e WHERE (e.name LIKE ? OR e.mobile_number LIKE ?)';
    const countParams = [`%${search}%`, `%${search}%`];

    if (role === 'admin') {
      if (assignedTo === 'only_assigned') {
        countSql += ' AND e.assigned_to IS NOT NULL';
      } else if (assignedTo) {
        countSql += ' AND e.assigned_to = ?';
        countParams.push(assignedTo);
      }
    } else {
      countSql += " AND e.assigned_to = ?";
      countParams.push(userId);
    }

    if (type) {
      countSql += ' AND type = ?';
      countParams.push(type);
    }
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0].total;

    return NextResponse.json({ 
      enquiries: enquiries || [], 
      total: total || 0, 
      page, 
      limit,
      VERIFICATION: "FORCE_DYNAMIC_V3",
      debug: { userId, role, assignedTo, sql, params } 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ enquiries: [], total: 0, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { name, contact_person, mobile, email, address, comment, type, msg_sent, status } = data;

    const sql = `
      INSERT INTO enquiries (name, contact_person, mobile_number, email, address, comment, type, msg_sent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      name || '',
      contact_person || '',
      mobile || '',
      email || '',
      address || '',
      comment || '',
      type || 'Other',
      msg_sent || 'No',
      status || 'Pending'
    ]);

    return NextResponse.json({ id: result.insertId, message: 'Enquiry created successfully' });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
