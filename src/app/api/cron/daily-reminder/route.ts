import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { sendDailyReminder } from '@/lib/email';
import { sendWhatsAppReminder } from '@/lib/whatsapp';
import type { Contact, ContactWithLastInteraction } from '@/types';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'personal-crm-cron';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await initDatabase();
    const db = getDb();

    const contactsResult = await db.execute(`
      SELECT 
        c.*,
        i.interacted_at as last_interaction
      FROM contacts c
      LEFT JOIN interactions i ON c.id = i.contact_id
      GROUP BY c.id
    `);

    const dueContacts: ContactWithLastInteraction[] = [];

    for (const row of contactsResult.rows) {
      const contact = row as unknown as Contact & { last_interaction: string | null };
      const lastInteraction = contact.last_interaction;
      
      let daysSinceInteraction: number | null = null;

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
      const isDue = daysSinceInteraction === null || daysSinceInteraction >= threshold;

      if (isDue) {
        dueContacts.push({
          ...contact,
          last_interaction: lastInteraction,
          days_since_interaction: daysSinceInteraction,
          is_due: true,
        });
      }
    }

    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    const whatsappNumber = process.env.WHATSAPP_NUMBER;
    
    let emailSent = false;
    let whatsappSent = false;

    if (dueContacts.length > 0) {
      if (notificationEmail) {
        const result = await sendDailyReminder(notificationEmail, dueContacts);
        emailSent = result.success;
      }

      if (whatsappNumber) {
        const result = await sendWhatsAppReminder(whatsappNumber, dueContacts);
        whatsappSent = result.success;
      }
    }

    return NextResponse.json({ 
      success: true, 
      dueContacts: dueContacts.length,
      emailSent,
      whatsappSent
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ 
      error: 'Failed to process reminder',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
