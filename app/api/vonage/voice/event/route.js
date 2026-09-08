import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function processEvent(event) {
  console.log('Vonage Voice Event:', event);

  if (event.uuid && event.status) {
    const callSid = event.uuid; 
    let duration = event.duration || 0;
    let status = event.status; 

    const [logs] = await pool.query(
      `SELECT id, status FROM call_logs WHERE twilio_call_sid = ? OR parent_call_sid = ? LIMIT 1`,
      [callSid, event.conversation_uuid || 'N/A']
    );

    if (logs.length > 0) {
      const existingStatus = logs[0].status;
      const errorStatuses = ['failed', 'rejected', 'cancelled', 'busy', 'no-answer', 'unanswered', 'unavailable', 'timeout'];
      
      // If the call already failed on the outbound leg, don't let the inbound leg's "completed" overwrite it
      if (errorStatuses.includes(existingStatus) && status === 'completed') {
        status = existingStatus;
      }

      await pool.query(
        `UPDATE call_logs 
         SET status = ?, duration_seconds = GREATEST(duration_seconds, ?), parent_call_sid = COALESCE(parent_call_sid, ?) 
         WHERE id = ?`,
        [status, duration, event.conversation_uuid || callSid, logs[0].id]
      );
      
      await pool.query(
        `INSERT INTO call_events (call_log_id, event_type, event_data) VALUES (?, ?, ?)`,
        [logs[0].id, `VONAGE_${status.toUpperCase()}`, JSON.stringify(event)]
      );
    } else {
      // Race condition fallback: Webhook arrived before update-log API
      // Create a skeletal row so the status isn't lost. update-log will fill in the rest.
      await pool.query(
        `INSERT INTO call_logs (twilio_call_sid, parent_call_sid, status, duration_seconds) 
         VALUES (?, ?, ?, ?)`,
        [callSid, event.conversation_uuid || callSid, status, duration]
      );
      
      const [newLogs] = await pool.query(
        `SELECT id FROM call_logs WHERE twilio_call_sid = ? LIMIT 1`,
        [callSid]
      );
      if (newLogs.length > 0) {
        await pool.query(
          `INSERT INTO call_events (call_log_id, event_type, event_data) VALUES (?, ?, ?)`,
          [newLogs[0].id, `VONAGE_${status.toUpperCase()}`, JSON.stringify(event)]
        );
      }
    }
  }
}

export async function POST(request) {
  try {
    const event = await request.json();
    await processEvent(event);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Vonage POST event:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event = Object.fromEntries(searchParams.entries());
    await processEvent(event);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Vonage GET event:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
