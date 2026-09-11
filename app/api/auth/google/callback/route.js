import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    const getRedirectUrl = (path, queryParams) => {
      const urlObj = new URL(path, req.url);
      if (urlObj.hostname === 'localhost') {
        urlObj.protocol = 'http:';
      }
      for (const [key, value] of Object.entries(queryParams)) {
        urlObj.searchParams.set(key, value);
      }
      return urlObj;
    };

    if (error) {
      return NextResponse.redirect(getRedirectUrl('/settings/email', { error: 'Google auth failed' }));
    }

    if (!code) {
      return NextResponse.redirect(getRedirectUrl('/settings/email', { error: 'No code provided' }));
    }

    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user info to get the email address
    const response = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });
    
    const email = response.data.email;
    const { access_token, refresh_token, expiry_date } = tokens;

    // We must have a refresh token (requires prompt: 'consent')
    if (!refresh_token) {
        return NextResponse.redirect(getRedirectUrl('/settings/email', { error: 'No refresh token received. Please try again.' }));
    }

    // Check if any accounts exist to determine if this should be default
    const existing = await query('SELECT COUNT(*) as count FROM email_accounts');
    const isDefault = existing[0].count === 0 ? 1 : 0;

    // Upsert or insert
    const accounts = await query('SELECT id FROM email_accounts WHERE email = ?', [email]);
    if (accounts.length > 0) {
      await query(
        'UPDATE email_accounts SET access_token = ?, refresh_token = ?, expiry_date = ? WHERE email = ?',
        [access_token, refresh_token, expiry_date, email]
      );
    } else {
      await query(
        'INSERT INTO email_accounts (email, access_token, refresh_token, expiry_date, is_default) VALUES (?, ?, ?, ?, ?)',
        [email, access_token, refresh_token, expiry_date, isDefault]
      );
    }

    return NextResponse.redirect(getRedirectUrl('/settings/email', { success: 'Account connected successfully' }));
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    return NextResponse.redirect(getRedirectUrl('/settings/email', { error: 'Authentication failed' }));
  }
}
