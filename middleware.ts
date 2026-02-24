import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/api/auth/send-otp', '/api/auth/verify-otp', '/api/auth/me'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session_token')?.value;

  // Check if it's a public path
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith('/api/auth/'));
  
  // Allow public paths
  if (isPublicPath && !pathname.startsWith('/api/contacts') && !pathname.startsWith('/api/interactions') && !pathname.startsWith('/api/settings') && !pathname.startsWith('/api/cron')) {
    // If logged in and trying to access login, redirect to dashboard
    if (sessionToken && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect API routes (except auth)
  if (pathname.startsWith('/api/')) {
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect dashboard pages
  if (pathname.startsWith('/contacts') || pathname.startsWith('/settings')) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
