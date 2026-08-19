import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { contactId, is_fake } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const fakeValue = is_fake ? 1 : 0;
    const connection = await pool.getConnection();

    try {
      await connection.execute('UPDATE ai_contacts SET is_fake = ? WHERE id = ?', [fakeValue, contactId]);
      return NextResponse.json({ success: true, message: is_fake ? 'Successfully marked as fake' : 'Successfully reverted to real' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Mark as fake error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'This is a POST-only endpoint used for marking contacts as fake.' }, { status: 405 });
}
