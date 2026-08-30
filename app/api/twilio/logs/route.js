import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request) {
  try {
    const [logs] = await pool.query(`
      SELECT c.*, u.user_name 
      FROM call_logs c
      LEFT JOIN user_master u ON c.user_id = u.user_id
      ORDER BY c.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Fetch logs error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
