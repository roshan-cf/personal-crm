import { randomInt } from 'crypto';
import { getDb, initDatabase } from './db';

export interface OtpCode {
  id: number;
  email: string;
  code: string;
  expires_at: string;
  used: number;
  created_at: string;
}

export function generateOtp(): string {
  // Generate 6-digit OTP
  return randomInt(100000, 999999).toString();
}

export async function createOtp(email: string): Promise<string> {
  await initDatabase();
  const db = getDb();
  
  // Invalidate any existing unused OTPs for this email
  await db.execute({
    sql: `UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0`,
    args: [email],
  });
  
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  await db.execute({
    sql: `INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)`,
    args: [email, code, expiresAt.toISOString()],
  });
  
  return code;
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  await initDatabase();
  const db = getDb();
  
  const result = await db.execute({
    sql: `
      SELECT * FROM otp_codes 
      WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `,
    args: [email, code],
  });
  
  if (result.rows.length === 0) {
    return false;
  }
  
  // Mark OTP as used
  const otpId = result.rows[0].id;
  await db.execute({
    sql: `UPDATE otp_codes SET used = 1 WHERE id = ?`,
    args: [otpId],
  });
  
  return true;
}

export async function cleanupExpiredOtps(): Promise<void> {
  await initDatabase();
  const db = getDb();
  
  await db.execute(`DELETE FROM otp_codes WHERE expires_at < datetime('now')`);
}
