import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT * FROM user_settings WHERE user_id = ?`,
      args: [user.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        email_enabled: true,
        notification_email: user.email,
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const existing = await db.execute({
      sql: `SELECT user_id FROM user_settings WHERE user_id = ?`,
      args: [user.id],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO user_settings (user_id, email_enabled, notification_email, calendar_enabled, whatsapp_enabled, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          user.id,
          email_enabled ? 1 : 0,
          notification_email || user.email,
          calendar_enabled ? 1 : 0,
          whatsapp_enabled ? 1 : 0,
          whatsapp_number || '',
        ],
      });
    } else {
      await db.execute({
        sql: `UPDATE user_settings SET email_enabled = ?, notification_email = ?, calendar_enabled = ?, whatsapp_enabled = ?, whatsapp_number = ? WHERE user_id = ?`,
        args: [
          email_enabled ? 1 : 0,
          notification_email || user.email,
          calendar_enabled ? 1 : 0,
          whatsapp_enabled ? 1 : 0,
          whatsapp_number || '',
          user.id,
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
