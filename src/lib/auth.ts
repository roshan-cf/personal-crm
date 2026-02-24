import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { getDb, initDatabase } from './db';

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export function generateId(): string {
  return randomBytes(16).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  await initDatabase();
  const db = getDb();
  
  const sessionId = generateId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await db.execute({
    sql: `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`,
    args: [sessionId, userId, expiresAt.toISOString()],
  });
  
  return sessionId;
}

export async function getSession(sessionId: string): Promise<(Session & { user: User }) | null> {
  await initDatabase();
  const db = getDb();
  
  const result = await db.execute({
    sql: `
      SELECT s.*, u.id as user_id_col, u.email, u.name, u.created_at as user_created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `,
    args: [sessionId],
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    expires_at: row.expires_at as string,
    created_at: row.created_at as string,
    user: {
      id: row.user_id_col as string,
      email: row.email as string,
      name: row.name as string | null,
      created_at: row.user_created_at as string,
    },
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await initDatabase();
  const db = getDb();
  
  await db.execute({
    sql: `DELETE FROM sessions WHERE id = ?`,
    args: [sessionId],
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_token')?.value;
  
  if (!sessionId) {
    return null;
  }
  
  const session = await getSession(sessionId);
  return session?.user ?? null;
}

export async function createUser(email: string, name?: string): Promise<User> {
  await initDatabase();
  const db = getDb();
  
  const userId = generateId();
  
  await db.execute({
    sql: `INSERT INTO users (id, email, name) VALUES (?, ?, ?)`,
    args: [userId, email, name || null],
  });
  
  // Create default settings for user
  await db.execute({
    sql: `INSERT INTO user_settings (user_id, notification_email) VALUES (?, ?)`,
    args: [userId, email],
  });
  
  return {
    id: userId,
    email,
    name: name || null,
    created_at: new Date().toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await initDatabase();
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT * FROM users WHERE email = ?`,
    args: [email],
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0] as unknown as User;
}

export async function getOrCreateUser(email: string): Promise<User> {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }
  return createUser(email);
}
