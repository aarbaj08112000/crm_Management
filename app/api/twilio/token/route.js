import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // In a real app, this should come from a verified session/token

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No user ID provided' }, { status: 401 });
    }

    // Validate CRM user and permissions
    const [users] = await pool.query(
      'SELECT user_id, user_name, calling_enabled, daily_call_limit FROM user_master WHERE user_id = ? AND status = 1',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 403 });
    }

    const user = users[0];

    if (!user.calling_enabled) {
      return NextResponse.json({ success: false, error: 'Calling is disabled for this user' }, { status: 403 });
    }

    // Verify daily limits
    const [callCountResult] = await pool.query(
      `SELECT COUNT(*) as today_calls FROM call_logs WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
      [userId]
    );

    const todayCalls = callCountResult[0].today_calls;
    if (todayCalls >= user.daily_call_limit) {
      return NextResponse.json({ success: false, error: 'Daily call limit reached' }, { status: 403 });
    }

    // Generate Token
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKey = process.env.TWILIO_API_KEY_SID;
    const twilioApiSecret = process.env.TWILIO_API_KEY_SECRET;
    const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID;
    
    // We create a unique identity for the client, e.g., 'crm_user_1'
    const identity = `crm_user_${userId}`;

    if (!outgoingApplicationSid) {
      console.error('Missing TWILIO_TWIML_APP_SID');
      return NextResponse.json({ success: false, error: 'Missing TWILIO_TWIML_APP_SID. Upgrade your Twilio account to create a TwiML App.' }, { status: 500 });
    }

    if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret) {
      console.error('Missing Twilio configuration credentials');
      return NextResponse.json({ success: false, error: 'Missing Twilio API Keys in .env' }, { status: 500 });
    }

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid,
      incomingAllow: false, // Only outbound for now
    });

    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      { identity: identity }
    );
    token.addGrant(voiceGrant);

    return NextResponse.json({
      success: true,
      token: token.toJwt(),
      identity: identity
    });
  } catch (error) {
    console.error('Twilio token error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
