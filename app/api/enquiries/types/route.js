import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT DISTINCT type FROM enquiries WHERE type IS NOT NULL AND type != ""');
    const types = rows.map(r => r.type);
    return NextResponse.json({ types });
  } catch (error) {
    console.error('Fetch types error:', error);
    return NextResponse.json({ types: [] }, { status: 500 });
  }
}
