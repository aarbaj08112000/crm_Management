import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    
    const sql = `
      SELECT 
        a.id,
        a.action,
        a.description,
        a.attachments,
        a.created_at,
        u.user_name as user_name
      FROM activity_logs a
      LEFT JOIN user_master u ON a.user_id = u.user_id
      WHERE a.module = 'Enquiry' AND a.record_id = ?
      ORDER BY a.created_at DESC
    `;
    
    const [activities] = await pool.query(sql, [id]);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('GET Activities Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
