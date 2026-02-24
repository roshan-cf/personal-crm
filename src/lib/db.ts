import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is required');
    }

    db = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();
  
  // Users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // OTP codes table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Sessions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User settings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      email_enabled INTEGER DEFAULT 1,
      notification_email TEXT,
      calendar_enabled INTEGER DEFAULT 0,
      whatsapp_enabled INTEGER DEFAULT 0,
      whatsapp_number TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migrations: Add user_id to existing tables if they don't have it
  try {
    await db.execute(`ALTER TABLE contacts ADD COLUMN user_id TEXT`);
  } catch {
    // Column already exists
  }

  try {
    await db.execute(`ALTER TABLE interactions ADD COLUMN user_id TEXT`);
  } catch {
    // Column already exists
  }

  // Delete old data that doesn't have user_id (cleanup)
  try {
    await db.execute(`DELETE FROM contacts WHERE user_id IS NULL`);
    await db.execute(`DELETE FROM interactions WHERE user_id IS NULL`);
  } catch {
    // Ignore errors
  }
}
