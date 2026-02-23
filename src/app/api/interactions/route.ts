import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await initDatabase();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');

    let result;
    if (contactId) {
      result = await db.execute({
        sql: `SELECT * FROM interactions WHERE contact_id = ? ORDER BY interacted_at DESC`,
        args: [Number(contactId)],
      });
    } else {
      result = await db.execute(`SELECT * FROM interactions ORDER BY interacted_at DESC`);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const db = getDb();
    const body = await request.json();

    const { contact_id, notes } = body;

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    const result = await db.execute({
      sql: `INSERT INTO interactions (contact_id, notes) VALUES (?, ?)`,
      args: [Number(contact_id), notes || null],
    });

    return NextResponse.json({ 
      id: Number(result.lastInsertRowid),
      contact_id: Number(contact_id),
      notes: notes || null,
      interacted_at: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
  }
}
