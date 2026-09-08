import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request) {
  try {
    const formData = await request.formData();
    console.log('--- TWILIO WEBHOOK PAYLOAD ---');
    console.log(Object.fromEntries(formData.entries()));
    console.log('------------------------------');
    
    const to = formData.get('To');
    const from = formData.get('From'); // usually client:crm_user_1
    const callSid = formData.get('CallSid');
    
    // Extract user ID from custom params sent by frontend, or fallback to the client identifier
    let userId = formData.get('userId');
    const clientSourceType = formData.get('sourceType');
    const clientSourceId = formData.get('sourceId');
    
    if (!userId && from && from.includes('crm_user_')) {
      // Sometimes it's 'client:crm_user_1', sometimes just 'crm_user_1'
      const match = from.match(/crm_user_(\d+)/);
      if (match) userId = match[1];
    }

    // Default TwiML
    const twiml = new VoiceResponse();

    let isIncoming = false;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '';
    const cleanTo = to ? to.replace(/\D/g, '') : '';
    const cleanTwilio = twilioNumber.replace(/\D/g, '');
    
    if (cleanTo && cleanTwilio && cleanTo.slice(-10) === cleanTwilio.slice(-10)) {
      isIncoming = true;
    }

    if (!userId && !isIncoming) {
      twiml.say('User authentication failed.');
      return new NextResponse(twiml.toString(), {
        status: 403,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Default to admin user for incoming calls if not specified
    if (isIncoming && !userId) {
      userId = 1;
    }

    // Skipped DB permission check because twilio_migration.sql hasn't been run yet
    
    // Simple country check based on E.164 code (assuming simple parsing for now)
    // Twilio tests usually require +1, we can skip strict country parsing in test mode
    const mode = process.env.CALLING_MODE || 'test';
    
    // Create initial Call Log in DB
    // Source mapping will be sent in custom parameters if possible, or updated later via UI.
    // For now, we will save an initial record and frontend can UPDATE it with source_id.
    let logId = null;
    try {
      let finalSourceType = clientSourceType || 'CONTACT';
      let finalSourceId = clientSourceId ? parseInt(clientSourceId, 10) : 0;

      // Try to reverse-lookup to match the incoming number to a Lead/Contact
      const searchNumber = isIncoming ? from : to;
      const cleanToNumber = searchNumber ? searchNumber.replace('+', '') : '';
      const last10 = cleanToNumber.slice(-10);
      
      if (!clientSourceType || finalSourceId === 0) {
        const [leadRows] = await pool.query(
          'SELECT enquiry_id FROM enquiries WHERE mobile_number LIKE ? LIMIT 1', 
          [`%${last10}%`]
        );

        if (leadRows.length > 0) {
          finalSourceType = 'LEAD';
          finalSourceId = leadRows[0].enquiry_id;
        } else {
          // Try to find in ai_contacts
          const [contactRows] = await pool.query(
            'SELECT id FROM ai_contacts WHERE phone LIKE ? LIMIT 1', 
            [`%${last10}%`]
          );
          if (contactRows.length > 0) {
            finalSourceType = 'CONTACT';
            finalSourceId = contactRows[0].id;
          }
        }
      }

      const [logResult] = await pool.query(
        `INSERT INTO call_logs (user_id, source_type, source_id, twilio_call_sid, from_number, to_number, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'initiated')`,
        [userId, finalSourceType, finalSourceId, callSid, from, to]
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

    if (isIncoming) {
      // Incoming Call: Ring the browser client
      // For Trial accounts, we must set callerId to the Twilio number to avoid "unverified number" errors.
      const dial = twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER,
        record: 'record-from-answer',
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/twilio/recording?parentCallSid=${callSid}`,
        recordingStatusCallbackEvent: ['completed'],
        action: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/twilio/status`,
        method: 'POST'
      });
      const client = dial.client(`crm_user_${userId}`);
      
      // Pass the original caller's number as a custom parameter so the frontend can display it
      client.parameter({ name: 'customerNumber', value: from });
    } else {
      // Outgoing Call: Dial the external phone number
      const dial = twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER,
        record: 'record-from-answer',
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/twilio/recording?parentCallSid=${callSid}`,
        recordingStatusCallbackEvent: ['completed'],
        action: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/twilio/status`,
        method: 'POST'
      });
      
      // Ensure the number is formatted in E.164 standard. 
      // If it's exactly 10 digits and has no country code, assume India (+91)
      let formattedTo = to;
      if (formattedTo && !formattedTo.startsWith('+')) {
        // Remove any spaces or dashes
        const cleanNum = formattedTo.replace(/\D/g, '');
        if (cleanNum.length === 10) {
          formattedTo = '+91' + cleanNum;
        } else {
          formattedTo = '+' + cleanNum; // attempt generic prepend
        }
      }

      dial.number(formattedTo);
    }

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
