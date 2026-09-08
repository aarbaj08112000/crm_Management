import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN; // We need Auth Token, not API Key for basic REST client
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // Make sure this is ngrok if local

export async function POST(request) {
  try {
    const body = await request.json();
    const { To: leadNumber, userId, sourceType, sourceId } = body;

    if (!leadNumber || !userId) {
      return NextResponse.json({ success: false, error: 'Missing lead number or user ID' }, { status: 400 });
    }

    // 1. Fetch user's mobile number
    const [users] = await pool.query(
      'SELECT mobile, calling_enabled FROM user_master WHERE user_id = ? AND status = 1',
      [userId]
    );

    if (users.length === 0 || !users[0].calling_enabled) {
      return NextResponse.json({ success: false, error: 'Calling disabled or user not found' }, { status: 403 });
    }

    const userMobile = users[0].mobile;
    if (!userMobile) {
      return NextResponse.json({ success: false, error: 'Your user profile does not have a mobile number configured.' }, { status: 400 });
    }

    // Note: ensure userMobile is correctly formatted with country code. Assuming +91 or +1 is standard.
    const formattedUserMobile = userMobile.startsWith('+') ? userMobile : `+${userMobile}`;
    const formattedLeadMobile = leadNumber.startsWith('+') ? leadNumber : `+${leadNumber}`;

    // 2. Initialize Twilio Client
    // We use Account SID and Auth Token for the REST API
    const client = twilio(twilioAccountSid, twilioAuthToken);

    // 3. Initiate the call to the Sales Person's mobile
    // When they pick up, Twilio will fetch the TwiML from the URL
    // We pass the lead's number and userId as URL query parameters!
    const callbackUrl = new URL('/api/twilio/voice', baseUrl);
    callbackUrl.searchParams.append('LeadNumber', formattedLeadMobile);
    callbackUrl.searchParams.append('userId', userId);
    callbackUrl.searchParams.append('sourceType', sourceType || 'CONTACT');
    callbackUrl.searchParams.append('sourceId', sourceId || '0');

    const call = await client.calls.create({
      url: callbackUrl.toString(),
      to: formattedUserMobile,
      from: twilioPhoneNumber, // This is the Twilio number that will ring the Sales Person
      method: 'POST'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Call initiated! Your phone will ring shortly.',
      callSid: call.sid 
    });

  } catch (error) {
    console.error('Error initiating click-to-call:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
