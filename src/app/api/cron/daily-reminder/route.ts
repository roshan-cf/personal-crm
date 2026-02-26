import { NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { sendDailyReminder } from '@/lib/email';
import { createTasksForDueContacts } from '@/lib/calendar';
import { sendBulkWhatsAppMessages } from '@/lib/whatsapp';
import type { Contact, ContactWithLastInteraction, User, UserSettings } from '@/types';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'personal-crm-cron';
  const isManual = new URL(request.url).searchParams.get('manual') === 'true';
  
  if (!isManual && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();
    const db = getDb();

    // Get all users with their settings
    const usersResult = await db.execute(`
      SELECT u.*, us.email_enabled, us.notification_email, us.calendar_enabled, us.google_refresh_token, us.whatsapp_enabled, us.whatsapp_number
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
    `);

    let totalEmailsSent = 0;
    let totalTasksCreated = 0;
    let totalWhatsAppSent = 0;
    let totalDueContacts = 0;

    for (const userRow of usersResult.rows) {
      const user = userRow as unknown as User & UserSettings;
      
      // Get contacts for this user
      const contactsResult = await db.execute({
        sql: `
          SELECT 
            c.*,
            i.interacted_at as last_interaction
          FROM contacts c
          LEFT JOIN interactions i ON c.id = i.contact_id AND i.user_id = ?
          WHERE c.user_id = ?
          GROUP BY c.id
        `,
        args: [user.id, user.id],
      });

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

      totalDueContacts += dueContacts.length;

      if (dueContacts.length === 0) continue;

      // Send email notification
      if (user.email_enabled !== false) {
        const emailTo = user.notification_email || user.email;
        const result = await sendDailyReminder(emailTo, dueContacts);
        if (result.success) {
          totalEmailsSent++;
        }
      }

      // Create tasks
      if (user.calendar_enabled && user.google_refresh_token) {
        const contactNames = dueContacts.map(c => ({ name: c.name, relation: c.relation }));
        const result = await createTasksForDueContacts(user.id, contactNames);
        totalTasksCreated += result.success;
      }

      // Send WhatsApp notifications
      if (user.whatsapp_enabled) {
        const contactsWithPhone = dueContacts
          .filter(c => c.phone)
          .map(c => ({ name: c.name, phone: c.phone! }));
        
        if (contactsWithPhone.length > 0) {
          const result = await sendBulkWhatsAppMessages(contactsWithPhone);
          totalWhatsAppSent += result.sent;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      usersProcessed: usersResult.rows.length,
      totalDueContacts,
      emailsSent: totalEmailsSent,
      tasksCreated: totalTasksCreated,
      whatsappSent: totalWhatsAppSent,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ 
      error: 'Failed to process reminder',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
