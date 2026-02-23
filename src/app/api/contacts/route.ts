import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import type { Contact, ContactWithLastInteraction } from '@/types';

export async function GET() {
  try {
    await initDatabase();
    const db = getDb();

    const contactsResult = await db.execute(`
      SELECT 
        c.*,
        i.interacted_at as last_interaction
      FROM contacts c
      LEFT JOIN interactions i ON c.id = i.contact_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    const contacts: ContactWithLastInteraction[] = contactsResult.rows.map((row) => {
      const contact = row as unknown as Contact & { last_interaction: string | null };
      const lastInteraction = contact.last_interaction;
      
      let daysSinceInteraction: number | null = null;
      let isDue = false;

      if (lastInteraction) {
        const lastDate = new Date(lastInteraction);
        const now = new Date();
        daysSinceInteraction = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const frequencyDays: Record<string, number> = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        yearly: 365,
      };

      const threshold = frequencyDays[contact.frequency] || 7;
      isDue = daysSinceInteraction === null || daysSinceInteraction >= threshold;

      return {
        ...contact,
        frequency_day: contact.frequency_day ?? null,
        last_interaction: lastInteraction,
        days_since_interaction: daysSinceInteraction,
        is_due: isDue,
      };
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const db = getDb();
    const body = await request.json();

    const { name, relation, remarks, frequency, frequency_day, category } = body;

    if (!name || !relation) {
      return NextResponse.json({ error: 'Name and relation are required' }, { status: 400 });
    }

    const result = await db.execute({
      sql: `INSERT INTO contacts (name, relation, remarks, frequency, frequency_day, category) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [name, relation, remarks || null, frequency || 'weekly', frequency_day ?? null, category || 'friends'],
    });

    const contactId = Number(result.lastInsertRowid);
    const newContact = await db.execute({
      sql: `SELECT * FROM contacts WHERE id = ?`,
      args: [contactId],
    });

    return NextResponse.json(newContact.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
