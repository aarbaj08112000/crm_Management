import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    const { callSid, sourceType, sourceId, userId } = await request.json();

    if (!callSid) {
      return NextResponse.json({ success: false, error: 'Missing callSid' }, { status: 400 });
    }

    // Update the call_logs table with the exact context
    await pool.query(
      `UPDATE call_logs 
       SET source_type = ?, source_id = ?, user_id = ?
       WHERE twilio_call_sid = ? OR parent_call_sid = ?`,
      [sourceType, sourceId, userId, callSid, callSid]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update call log error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
