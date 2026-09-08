import { NextResponse } from 'next/server';
import { tokenGenerate } from '@vonage/jwt';
import { Vonage } from '@vonage/server-sdk';
import { pool } from '@/lib/db';

const vonageApiKey = process.env.VONAGE_API_KEY || '';
const vonageApiSecret = process.env.VONAGE_API_SECRET || '';
const vonageApplicationId = process.env.VONAGE_APPLICATION_ID || '';
const vonagePrivateKey = process.env.VONAGE_PRIVATE_KEY ? process.env.VONAGE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';

const vonage = new Vonage({
  apiKey: vonageApiKey,
  apiSecret: vonageApiSecret,
  applicationId: vonageApplicationId,
  privateKey: vonagePrivateKey
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const userName = `crm_user_${userId}`;

    // Ensure the Vonage User exists
    try {
      await vonage.users.createUser({ name: userName, display_name: `CRM User ${userId}` });
    } catch (e) {
      // If the user already exists, it will throw an error, which we can ignore
      if (e.response?.status !== 409 && e.response?.status !== 400) {
        console.warn('Could not create Vonage user, it might already exist or there was an error:', e.response?.data || e.message);
      }
    }

    // Generate JWT for Client SDK
    const acl = {
      "paths": {
        "/*/rtc/**": {},
        "/*/users/**": {},
        "/*/conversations/**": {},
        "/*/sessions/**": {},
        "/*/devices/**": {},
        "/*/image/**": {},
        "/*/media/**": {},
        "/*/applications/**": {},
        "/*/push/**": {},
        "/*/knocking/**": {},
        "/*/legs/**": {}
      }
    };

    const token = tokenGenerate(
      vonageApplicationId,
      vonagePrivateKey,
      {
        sub: userName,
        acl: acl,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
      }
    );

    return NextResponse.json({ success: true, token, userName });
  } catch (error) {
    console.error('Error generating Vonage token:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate token' }, { status: 500 });
  }
}
