import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyOtp } from '@/lib/otp';
import { getOrCreateUser, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isValid = await verifyOtp(normalizedEmail, code);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Get or create user
    const user = await getOrCreateUser(normalizedEmail);
    
    // Create session
    const sessionId = await createSession(user.id);
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
