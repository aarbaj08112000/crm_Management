import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const logs = await query('SELECT id, subject, direction, is_read, enquiry_id, sent_at FROM email_logs WHERE enquiry_id = 9 ORDER BY id DESC LIMIT 10');
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
