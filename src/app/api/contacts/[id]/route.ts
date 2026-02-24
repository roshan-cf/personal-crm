import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    const db = getDb();
    const { id } = await params;

    const result = await db.execute({
      sql: `SELECT * FROM contacts WHERE id = ? AND user_id = ?`,
      args: [Number(id), user.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const { name, relation, remarks, frequency, frequency_day, category } = body;

    if (!name || !relation) {
      return NextResponse.json({ error: 'Name and relation are required' }, { status: 400 });
    }

    await db.execute({
      sql: `UPDATE contacts SET name = ?, relation = ?, remarks = ?, frequency = ?, frequency_day = ?, category = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      args: [name, relation, remarks || null, frequency || 'weekly', frequency_day ?? null, category || 'friends', Number(id), user.id],
    });

    const updatedContact = await db.execute({
      sql: `SELECT * FROM contacts WHERE id = ?`,
      args: [Number(id)],
    });

    return NextResponse.json(updatedContact.rows[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    const db = getDb();
    const { id } = await params;

    await db.execute({
      sql: `DELETE FROM interactions WHERE contact_id = ? AND user_id = ?`,
      args: [Number(id), user.id],
    });

    await db.execute({
      sql: `DELETE FROM contacts WHERE id = ? AND user_id = ?`,
      args: [Number(id), user.id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
