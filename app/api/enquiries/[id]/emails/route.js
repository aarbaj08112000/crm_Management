import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const id = params.id;
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') || 'All'; // 'All', 'Sent', 'Received'

    let sql = `
      SELECT e.*, 
             u.user_name as sender_name
      FROM email_logs e
      LEFT JOIN user_master u ON e.user_id = u.user_id
      WHERE e.enquiry_id = ?
    `;

    const queryParams = [id];

    if (filter === 'Sent') {
      sql += ` AND e.direction = 'sent'`;
    } else if (filter === 'Received') {
      sql += ` AND e.direction = 'received'`;
    }

    sql += ` ORDER BY e.sent_at DESC`;

    const emails = await query(sql, queryParams);
    
    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Fetch emails error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
