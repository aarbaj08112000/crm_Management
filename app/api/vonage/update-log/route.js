import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    const { callSid, sourceType, sourceId, userId, toNumber } = await request.json();

    if (!callSid) {
      return NextResponse.json({ success: false, error: 'Missing callSid' }, { status: 400 });
    }

    const fromNumber = process.env.VONAGE_PHONE_NUMBER || 'VonageWebRTC';

    // Check if the log already exists (in case the webhook fired faster)
    const [existing] = await pool.query('SELECT id FROM call_logs WHERE twilio_call_sid = ?', [callSid]);

    if (existing.length === 0) {
      // Insert the new call log
      await pool.query(
        `INSERT INTO call_logs (user_id, source_type, source_id, twilio_call_sid, from_number, to_number, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'in-progress')`,
        [userId, sourceType, sourceId, callSid, fromNumber, toNumber]
      );
    } else {
      // Update existing
      await pool.query(
        `UPDATE call_logs 
         SET source_type = ?, source_id = ?, user_id = ?, to_number = ?
         WHERE twilio_call_sid = ?`,
        [sourceType, sourceId, userId, toNumber, callSid]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vonage update call log error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
