import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await initDatabase();
    const db = getDb();

    await db.execute({
      sql: `UPDATE users SET name = ? WHERE id = ?`,
      args: [name.trim(), user.id],
    });

    return NextResponse.json({ success: true, name: name.trim() });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
