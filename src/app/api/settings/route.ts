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
        email_schedule_time: '09:00',
        calendar_enabled: false,
        calendar_schedule_time: '09:00',
        whatsapp_enabled: false,
        whatsapp_number: '',
        whatsapp_schedule_time: '09:00',
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
      email_schedule_time,
      calendar_enabled,
      calendar_schedule_time,
      whatsapp_enabled,
      whatsapp_number,
      whatsapp_schedule_time,
    } = body;

    const existing = await db.execute({
      sql: `SELECT user_id FROM user_settings WHERE user_id = ?`,
      args: [user.id],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO user_settings (user_id, email_enabled, notification_email, email_schedule_time, calendar_enabled, calendar_schedule_time, whatsapp_enabled, whatsapp_number, whatsapp_schedule_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.id,
          email_enabled ? 1 : 0,
          notification_email || user.email,
          email_schedule_time || '09:00',
          calendar_enabled ? 1 : 0,
          calendar_schedule_time || '09:00',
          whatsapp_enabled ? 1 : 0,
          whatsapp_number || '',
          whatsapp_schedule_time || '09:00',
        ],
      });
    } else {
      await db.execute({
        sql: `UPDATE user_settings SET email_enabled = ?, notification_email = ?, email_schedule_time = ?, calendar_enabled = ?, calendar_schedule_time = ?, whatsapp_enabled = ?, whatsapp_number = ?, whatsapp_schedule_time = ? WHERE user_id = ?`,
        args: [
          email_enabled ? 1 : 0,
          notification_email || user.email,
          email_schedule_time || '09:00',
          calendar_enabled ? 1 : 0,
          calendar_schedule_time || '09:00',
          whatsapp_enabled ? 1 : 0,
          whatsapp_number || '',
          whatsapp_schedule_time || '09:00',
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
