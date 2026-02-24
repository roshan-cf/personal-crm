import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', APP_URL));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      return NextResponse.redirect(new URL('/settings?error=google_auth_failed', APP_URL));
    }

    const redirectUri = `${APP_URL}/api/auth/google/callback`;

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
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', APP_URL));
    }

    const tokens = await tokenResponse.json();
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/settings?error=no_refresh_token', APP_URL));
    }

    // Save refresh token to database
    await initDatabase();
    const db = getDb();

    // Check if settings exist
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

    return NextResponse.redirect(new URL('/settings?google=connected', APP_URL));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=unknown', APP_URL));
  }
}
