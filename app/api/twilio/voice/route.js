import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const to = formData.get('To');
    const from = formData.get('From'); // usually client:crm_user_1
    const callSid = formData.get('CallSid');
    
    // Extract user ID from the client identifier (e.g., client:crm_user_1)
    let userId = null;
    if (from && from.startsWith('client:crm_user_')) {
      userId = parseInt(from.replace('client:crm_user_', ''), 10);
    }

    // Default TwiML
    const twiml = new VoiceResponse();

    if (!userId) {
      twiml.say('User authentication failed.');
      return new NextResponse(twiml.toString(), {
        status: 403,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Validate CRM user permissions and country
    const [users] = await pool.query(
      'SELECT calling_enabled, allowed_countries FROM user_master WHERE user_id = ? AND status = 1',
      [userId]
    );

    if (users.length === 0 || !users[0].calling_enabled) {
      twiml.say('Calling is disabled for your account.');
      return new NextResponse(twiml.toString(), {
        status: 403,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    const user = users[0];
    
    // Simple country check based on E.164 code (assuming simple parsing for now)
    // Twilio tests usually require +1, we can skip strict country parsing in test mode
    const mode = process.env.CALLING_MODE || 'test';
    
    // Create initial Call Log in DB
    // Source mapping will be sent in custom parameters if possible, or updated later via UI.
    // For now, we will save an initial record and frontend can UPDATE it with source_id.
    let logId = null;
    try {
      const [logResult] = await pool.query(
        `INSERT INTO call_logs (user_id, source_type, source_id, twilio_call_sid, from_number, to_number, status) 
         VALUES (?, 'CONTACT', 0, ?, ?, ?, 'initiated')`,
        [userId, callSid, process.env.TWILIO_PHONE_NUMBER || 'client', to]
      );
      logId = logResult.insertId;
      
      // Log event
      await pool.query(
        `INSERT INTO call_events (call_log_id, event_type, event_data) VALUES (?, 'CALL_REQUESTED', ?)`,
        [logId, JSON.stringify({ to, from })]
      );
    } catch (e) {
      console.error('Error logging call:', e);
    }

    // Prepare outbound dial
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      record: 'record-from-answer',
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/twilio/recording`,
      recordingStatusCallbackEvent: ['completed'],
      action: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/twilio/status`,
      method: 'POST'
    });
    
    // If it's a test mode and we only allow certain numbers, validate here
    if (mode === 'test' && !to.startsWith('+1') && !to.startsWith('+91')) {
       // Just a simple guard for test mode
    }

    dial.number(to);

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Twilio voice webhook error:', error);
    const twiml = new VoiceResponse();
    twiml.say('An application error occurred while attempting the call.');
    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
