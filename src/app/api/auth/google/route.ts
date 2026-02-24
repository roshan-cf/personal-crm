import { NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getAppUrl(request: Request): string {
  // Priority 1: Explicit env var (for production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  // Priority 2: Use the request origin (works for preview deployments)
  const requestUrl = new URL(request.url);
  return requestUrl.origin;
}

export async function GET(request: Request) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/settings?error=google_not_configured', getAppUrl(request)));
  }

  const appUrl = getAppUrl(request);
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  
  console.log('[Google OAuth] Using redirect_uri:', redirectUri);
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return NextResponse.redirect(authUrl);
}
