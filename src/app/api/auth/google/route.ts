import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/settings?error=google_not_configured', getAppUrl(request)));
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login?error=session_expired', getAppUrl(request)));
  }

  const appUrl = getAppUrl(request);
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  
  const state = Buffer.from(JSON.stringify({ sessionToken, redirectUri: '/settings' })).toString('base64');
  
  console.log('[Google OAuth] Using redirect_uri:', redirectUri);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return NextResponse.redirect(authUrl);
}
