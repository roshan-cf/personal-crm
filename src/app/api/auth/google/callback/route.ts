import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getAppUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const requestUrl = new URL(request.url);
  return requestUrl.origin;
}

export async function GET(request: Request) {
  const appUrl = getAppUrl(request);
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', appUrl));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('[Google OAuth] Error from Google:', error);
      return NextResponse.redirect(new URL(`/settings?error=${error}`, appUrl));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=no_code', appUrl));
    }

    const redirectUri = `${appUrl}/api/auth/google/callback`;
    
    console.log('[Google OAuth] Exchanging code with redirect_uri:', redirectUri);

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed:', errorText);
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', appUrl));
    }

    const tokens = await tokenResponse.json();
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      console.error('[Google OAuth] No refresh token in response');
      return NextResponse.redirect(new URL('/settings?error=no_refresh_token', appUrl));
    }

    // Save refresh token to database
    await initDatabase();
    const db = getDb();

    const existing = await db.execute({
      sql: `SELECT user_id FROM user_settings WHERE user_id = ?`,
      args: [user.id],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO user_settings (user_id, google_refresh_token, calendar_enabled) VALUES (?, ?, 1)`,
        args: [user.id, refreshToken],
      });
    } else {
      await db.execute({
        sql: `UPDATE user_settings SET google_refresh_token = ?, calendar_enabled = 1 WHERE user_id = ?`,
        args: [refreshToken, user.id],
      });
    }

    console.log('[Google OAuth] Successfully connected for user:', user.email);
    return NextResponse.redirect(new URL('/settings?google=connected', appUrl));
  } catch (error) {
    console.error('[Google OAuth] Callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=unknown', appUrl));
  }
}
