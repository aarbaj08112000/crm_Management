import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { Vonage } from '@vonage/server-sdk';

const vonageApiKey = process.env.VONAGE_API_KEY || '';
const vonageApiSecret = process.env.VONAGE_API_SECRET || '';
const vonageApplicationId = process.env.VONAGE_APPLICATION_ID || '';
// Handle newlines in the private key from .env
const vonagePrivateKey = process.env.VONAGE_PRIVATE_KEY ? process.env.VONAGE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';
const vonagePhoneNumber = process.env.VONAGE_PHONE_NUMBER || '';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const body = await request.json();
    const { To: leadNumber, userId, sourceType, sourceId } = body;

    if (!leadNumber || !userId) {
      return NextResponse.json({ success: false, error: 'Missing lead number or user ID' }, { status: 400 });
    }

    if (!vonageApiKey && !vonageApplicationId) {
       return NextResponse.json({ success: false, error: 'Vonage credentials are not configured in the environment variables.' }, { status: 500 });
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

    let formattedUserMobile = userMobile.startsWith('+') ? userMobile.substring(1) : userMobile;
    if (formattedUserMobile.length === 10) formattedUserMobile = '91' + formattedUserMobile;
    
    let formattedLeadMobile = leadNumber.startsWith('+') ? leadNumber.substring(1) : leadNumber;
    if (formattedLeadMobile.length === 10) formattedLeadMobile = '91' + formattedLeadMobile;

    // 2. Initialize Vonage Client
    const vonage = new Vonage({
      apiKey: vonageApiKey,
      apiSecret: vonageApiSecret,
      applicationId: vonageApplicationId,
      privateKey: vonagePrivateKey
    });

    // 3. Initiate the call to the Lead's mobile FIRST
    // When the Lead picks up, Vonage will fetch the NCCO from the answerUrl to call the Agent
    const callbackUrl = new URL('/api/vonage/voice/answer', baseUrl);
    callbackUrl.searchParams.append('UserNumber', formattedUserMobile);
    callbackUrl.searchParams.append('userId', userId);
    callbackUrl.searchParams.append('sourceType', sourceType || 'CONTACT');
    callbackUrl.searchParams.append('sourceId', sourceId || '0');

    const eventUrl = new URL('/api/vonage/voice/event', baseUrl);

    const callResponse = await vonage.voice.createOutboundCall({
      to: [{
        type: 'phone',
        number: formattedLeadMobile
      }],
      from: {
        type: 'phone',
        number: vonagePhoneNumber // Virtual number
      },
      answerUrl: [callbackUrl.toString()],
      eventUrl: [eventUrl.toString()]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Call initiated! Your phone will ring shortly.',
      callUuid: callResponse.uuid 
    });

  } catch (error) {
    console.error('Error initiating Vonage click-to-call:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to initiate call' }, { status: 500 });
  }
}
