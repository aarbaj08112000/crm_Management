import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;
    const role = (payload.role || '').toString().toLowerCase();

    let sql = `
      SELECT el.id, el.user_id, el.recipient_email, el.subject, el.body, el.sent_at, el.enquiry_id, el.direction, u.user_name, enq.added_date
      FROM email_logs el
      LEFT JOIN user_master u ON el.user_id = u.user_id
      LEFT JOIN enquiries enq ON el.enquiry_id = enq.enquiry_id
    `;
    const params = [];

    if (role !== 'admin') {
      sql += ' WHERE el.user_id = ?';
      params.push(userId);
    }
    
    sql += ' ORDER BY el.sent_at DESC';

    const logs = await query(sql, params);
    return NextResponse.json(logs);

  } catch (error) {
    console.error('Email logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
  }
}
