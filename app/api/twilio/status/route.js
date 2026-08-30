import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const duration = formData.get('CallDuration') || 0;

    if (!callSid) {
      return new NextResponse('Missing CallSid', { status: 400 });
    }

    // Update the call_logs table
    await pool.query(
      `UPDATE call_logs 
       SET status = ?, duration_seconds = ? 
       WHERE twilio_call_sid = ? OR parent_call_sid = ?`,
      [callStatus, duration, callSid, callSid]
    );

    // Get the log ID for the events table
    const [logs] = await pool.query(
      `SELECT id FROM call_logs WHERE twilio_call_sid = ? OR parent_call_sid = ? LIMIT 1`,
      [callSid, callSid]
    );

    if (logs.length > 0) {
      const logId = logs[0].id;
      // Log event
      await pool.query(
        `INSERT INTO call_events (call_log_id, event_type, event_data) VALUES (?, ?, ?)`,
        [logId, `CALL_${callStatus.toUpperCase()}`, JSON.stringify({ duration, status: callStatus })]
      );
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Twilio status webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
