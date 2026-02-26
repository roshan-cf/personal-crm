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
      google_refresh_token TEXT,
      google_calendar_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migrations: Add new columns to user_settings
  try {
    await db.execute(`ALTER TABLE user_settings ADD COLUMN google_refresh_token TEXT`);
  } catch {
    // Column already exists
  }

  try {
    await db.execute(`ALTER TABLE user_settings ADD COLUMN google_calendar_id TEXT`);
  } catch {
    // Column already exists
  }

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

  // Create indexes for performance
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email)`);
  } catch {
    // Index already exists
  }

  // Add phone column to contacts
  try {
    await db.execute(`ALTER TABLE contacts ADD COLUMN phone TEXT`);
  } catch {
    // Column already exists
  }

  // Add schedule time columns for channels
  try {
    await db.execute(`ALTER TABLE user_settings ADD COLUMN email_schedule_time TEXT DEFAULT '09:00'`);
  } catch {
    // Column already exists
  }

  try {
    await db.execute(`ALTER TABLE user_settings ADD COLUMN calendar_schedule_time TEXT DEFAULT '09:00'`);
  } catch {
    // Column already exists
  }

  try {
    await db.execute(`ALTER TABLE user_settings ADD COLUMN whatsapp_schedule_time TEXT DEFAULT '09:00'`);
  } catch {
    // Column already exists
  }
}
