import { NextResponse } from 'next/server';
import { createOtp } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpCode = await createOtp(normalizedEmail);
    const result = await sendOtpEmail(normalizedEmail, otpCode);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send OTP' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
