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
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      relation TEXT NOT NULL,
      remarks TEXT,
      frequency TEXT NOT NULL DEFAULT 'weekly',
      frequency_day INTEGER,
      category TEXT NOT NULL DEFAULT 'friends',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      interacted_at TEXT DEFAULT (datetime('now')),
      notes TEXT,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  try {
    await db.execute(`ALTER TABLE contacts ADD COLUMN frequency_day INTEGER`);
  } catch {
    // Column already exists
  }
}
