import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await initDatabase();
    const db = getDb();

    const result = await db.execute(`
      SELECT * FROM settings WHERE id = 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({
        email_enabled: false,
        notification_email: '',
        calendar_enabled: false,
        whatsapp_enabled: false,
        whatsapp_number: '',
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await initDatabase();
    const db = getDb();
    const body = await request.json();

    const {
      email_enabled,
      notification_email,
      calendar_enabled,
      whatsapp_enabled,
      whatsapp_number,
    } = body;

    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        email_enabled INTEGER DEFAULT 0,
        notification_email TEXT DEFAULT '',
        calendar_enabled INTEGER DEFAULT 0,
        whatsapp_enabled INTEGER DEFAULT 0,
        whatsapp_number TEXT DEFAULT ''
      )
    `);

    const existing = await db.execute(`SELECT id FROM settings WHERE id = 1`);

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO settings (id, email_enabled, notification_email, calendar_enabled, whatsapp_enabled, whatsapp_number) VALUES (1, ?, ?, ?, ?, ?)`,
        args: [
          email_enabled ? 1 : 0,
          notification_email || '',
          calendar_enabled ? 1 : 0,
          whatsapp_enabled ? 1 : 0,
          whatsapp_number || '',
        ],
      });
    } else {
      await db.execute({
        sql: `UPDATE settings SET email_enabled = ?, notification_email = ?, calendar_enabled = ?, whatsapp_enabled = ?, whatsapp_number = ? WHERE id = 1`,
        args: [
          email_enabled ? 1 : 0,
          notification_email || '',
          calendar_enabled ? 1 : 0,
          whatsapp_enabled ? 1 : 0,
          whatsapp_number || '',
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
