import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import fs from 'fs';

export async function GET(request) {
  return handleWebhook(request);
}

export async function POST(request) {
  return handleWebhook(request);
}

function logDebug(msg) {
  try {
    fs.appendFileSync('/var/www/html/extra_work/crm/crm_Management/webhook_debug.log', new Date().toISOString() + ' ' + msg + '\n');
  } catch (e) {}
}

async function handleWebhook(request) {
  try {
    const { searchParams } = new URL(request.url);
    let body = {};
    
    logDebug(`Received ${request.method} request to ${request.url}`);
    
    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        logDebug(`Content-Type: ${contentType}`);
        
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
          const textBody = await request.text();
          logDebug(`Raw Body: ${textBody}`);
          const params = new URLSearchParams(textBody);
          for (const [key, value] of params.entries()) {
            body[key] = value;
          }
        } else {
           // fallback
           const textBody = await request.text();
           logDebug(`Fallback Raw Body: ${textBody}`);
           try {
              body = JSON.parse(textBody);
           } catch(e) {}
        }
      } catch (e) {
        logDebug(`Failed to parse body: ${e.message}`);
      }
    }

    logDebug(`searchParams: ${searchParams.toString()}`);
    logDebug(`body: ${JSON.stringify(body)}`);

    const getParam = (key) => searchParams.get(key) || body[key] || searchParams.get(key.toLowerCase()) || body[key.toLowerCase()];
    
    // CloudTelephony Parameters
    const type = getParam('type');
    const sourceNumber = getParam('SourceNumber');
    const destinationNumber = getParam('DestinationNumber');
    const dialWhomNumber = getParam('DialWhomNumber');
    const callDuration = getParam('CallDuration');
    const status = getParam('Status');
    const callSid = getParam('CallSid');
    const callRecordingUrl = getParam('CallRecordingUrl');
    const direction = getParam('Direction');
    
    logDebug(`Extracted: type=${type}, callSid=${callSid}`);

    // Remove the early return for non-call_report types
    // if (type !== 'call_report') {
    //   return NextResponse.json({ success: true, message: 'Ignored: Not a call report' });
    // }

    if (!callSid) {
      logDebug(`Missing callSid. Returning 400`);
      return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
    }
    
    const currentStatus = status || type || 'initiated';

    // Try to find the associated User ID based on the DialWhomNumber (Agent's number)
    let userId = null;
    if (dialWhomNumber) {
      logDebug(`Looking up user for DialWhomNumber: ${dialWhomNumber}`);
      const [sipUsers] = await pool.query('SELECT user_id FROM user_master WHERE sip_username = ? LIMIT 1', [dialWhomNumber]);
      if (sipUsers.length > 0) {
        userId = sipUsers[0].user_id;
      } else {
        const [mobileUsers] = await pool.query('SELECT user_id FROM user_master WHERE mobile = ? LIMIT 1', [dialWhomNumber]);
        if (mobileUsers.length > 0) {
          userId = mobileUsers[0].user_id;
        }
      }
    }
    logDebug(`Assigned userId: ${userId}`);

    if (!userId) {
      logDebug(`Could not find user. Defaulting to user_id=1`);
      userId = 1; // Fallback to admin if not found to prevent NOT NULL constraint error
    }

    // Check if Call Log already exists
    const [existing] = await pool.query('SELECT id FROM call_logs WHERE twilio_call_sid = ? LIMIT 1', [callSid]);
    
    let callLogId = null;

    if (existing.length > 0) {
      callLogId = existing[0].id;
      logDebug(`Updating existing log for callSid: ${callSid}`);
      
      // Build dynamic update query to avoid overwriting final data with intermediate empty data
      let updateFields = ['status = ?'];
      let updateValues = [currentStatus];
      
      if (callDuration) {
        updateFields.push('duration_seconds = ?');
        updateValues.push(callDuration);
      }
      if (callRecordingUrl) {
        updateFields.push('recording_url = ?');
        updateValues.push(callRecordingUrl);
      }
      
      updateValues.push(callSid);
      
      await pool.query(
        `UPDATE call_logs SET ${updateFields.join(', ')} WHERE twilio_call_sid = ?`,
        updateValues
      );
    } else {
      logDebug(`Inserting new log for callSid: ${callSid}`);
      // Note: source_type requires 'LEAD', 'CONTACT', or 'CUSTOMER'. We default to 'CONTACT'.
      // source_id requires an integer. We default to 0.
      const [insertResult] = await pool.query(
        `INSERT INTO call_logs (user_id, source_type, source_id, twilio_call_sid, from_number, to_number, duration_seconds, recording_url, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, 
          'CONTACT', 
          0,
          callSid, 
          sourceNumber || null, 
          destinationNumber || null, 
          callDuration || 0, 
          callRecordingUrl || null, 
          currentStatus
        ]
      );
      callLogId = insertResult.insertId;
    }
    
    if (callLogId) {
      logDebug(`Inserting into call_events for callLogId: ${callLogId}`);
      await pool.query(
        `INSERT INTO call_events (call_log_id, event_type, event_data) VALUES (?, ?, ?)`,
        [callLogId, type || 'unknown', JSON.stringify({
          sourceNumber, destinationNumber, dialWhomNumber, callDuration, status: currentStatus, direction, rawBody: body, searchParams: searchParams.toString()
        })]
      );
    }

    logDebug(`Successfully processed webhook.`);
    return NextResponse.json({ success: true, message: 'Call log processed successfully' });
  } catch (error) {
    logDebug(`CRITICAL ERROR: ${error.message}\n${error.stack}`);
    console.error('CloudTelephony Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
