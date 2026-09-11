import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET() {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
    scope: [
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });

  return NextResponse.redirect(authUrl);
}
