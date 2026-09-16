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

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'Total';

    let sql = `
      SELECT el.id, el.user_id, el.recipient_email, el.subject, el.body, el.sent_at, el.enquiry_id, el.direction, el.attachments, u.user_name, enq.added_date
      FROM email_logs el
      LEFT JOIN user_master u ON el.user_id = u.user_id
      LEFT JOIN enquiries enq ON el.enquiry_id = enq.enquiry_id
      WHERE 1=1
    `;
    const params = [];

    if (role !== 'admin') {
      sql += ' AND el.user_id = ?';
      params.push(userId);
    }
    
    if (period === 'Today') {
      sql += ' AND DATE(el.sent_at) = CURDATE()';
    } else if (period === 'Yesterday') {
      sql += ' AND DATE(el.sent_at) = CURDATE() - INTERVAL 1 DAY';
    } else if (period === 'Week') {
      sql += ' AND YEARWEEK(el.sent_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (period === 'Month') {
      sql += ' AND MONTH(el.sent_at) = MONTH(CURDATE()) AND YEAR(el.sent_at) = YEAR(CURDATE())';
    } else if (period === 'Year') {
      sql += ' AND YEAR(el.sent_at) = YEAR(CURDATE())';
    }

    sql += ' ORDER BY el.sent_at DESC';

    const logs = await query(sql, params);
    return NextResponse.json(logs);

  } catch (error) {
    console.error('Email logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
  }
}
