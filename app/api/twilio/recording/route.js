import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid');
    const recordingSid = formData.get('RecordingSid');
    const recordingUrl = formData.get('RecordingUrl');
    const recordingDuration = formData.get('RecordingDuration') || 0;

    if (!callSid || !recordingSid) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // Update the call_logs table
    await pool.query(
      `UPDATE call_logs 
       SET recording_sid = ?, recording_url = ?, recording_duration = ? 
       WHERE twilio_call_sid = ? OR parent_call_sid = ?`,
      [recordingSid, recordingUrl, recordingDuration, callSid, callSid]
    );

    // Get the log ID for the events table
    const [logs] = await pool.query(
      `SELECT id FROM call_logs WHERE twilio_call_sid = ? OR parent_call_sid = ? LIMIT 1`,
      [callSid, callSid]
    );

    if (logs.length > 0) {
      const logId = logs[0].id;
      await pool.query(
        `INSERT INTO call_events (call_log_id, event_type, event_data) VALUES (?, 'RECORDING_CREATED', ?)`,
        [logId, JSON.stringify({ recordingSid, recordingDuration })]
      );
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Twilio recording webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
