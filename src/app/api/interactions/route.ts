import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');

    let result;
    if (contactId) {
      result = await db.execute({
        sql: `SELECT * FROM interactions WHERE contact_id = ? AND user_id = ? ORDER BY interacted_at DESC`,
        args: [Number(contactId), user.id],
      });
    } else {
      result = await db.execute({
        sql: `SELECT * FROM interactions WHERE user_id = ? ORDER BY interacted_at DESC`,
        args: [user.id],
      });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
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

    const { contact_id, notes } = body;

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    // Verify contact belongs to user
    const contactCheck = await db.execute({
      sql: `SELECT id FROM contacts WHERE id = ? AND user_id = ?`,
      args: [Number(contact_id), user.id],
    });

    if (contactCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const result = await db.execute({
      sql: `INSERT INTO interactions (user_id, contact_id, notes) VALUES (?, ?, ?)`,
      args: [user.id, Number(contact_id), notes || null],
    });

    return NextResponse.json({ 
      id: Number(result.lastInsertRowid),
      user_id: user.id,
      contact_id: Number(contact_id),
      notes: notes || null,
      interacted_at: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
  }
}
