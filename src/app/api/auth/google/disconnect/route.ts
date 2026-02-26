import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    const db = getDb();

    await db.execute({
      sql: `UPDATE user_settings SET google_refresh_token = NULL, calendar_enabled = 0 WHERE user_id = ?`,
      args: [user.id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
