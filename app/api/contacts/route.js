import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM ai_contacts ORDER BY added_date DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
