import { google } from 'googleapis';
import { getDb, initDatabase } from './db';

async function getOAuth2ClientForUser(userId: string) {
  await initDatabase();
  const db = getDb();

  const result = await db.execute({
    sql: `SELECT google_refresh_token FROM user_settings WHERE user_id = ?`,
    args: [userId],
  });

  const refreshToken = result.rows[0]?.google_refresh_token as string | undefined;

  if (!refreshToken) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export async function createCalendarEventForUser(
  userId: string,
  contactName: string,
  relation: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const auth = await getOAuth2ClientForUser(userId);
  
  if (!auth) {
    return { success: false, error: 'Google Calendar not connected' };
  }

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);

  try {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `📞 Call ${contactName}`,
        description: `Reach out to ${contactName} (${relation})\n\nLogged from Personal CRM`,
        start: {
          dateTime: today.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endOfToday.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 0 },
            { method: 'email', minutes: 30 },
          ],
        },
      },
    });

    return { success: true, eventId: event.data.id || undefined };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function createCalendarEventsForDueContacts(
  userId: string,
  contacts: Array<{ name: string; relation: string }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const contact of contacts) {
    const result = await createCalendarEventForUser(userId, contact.name, contact.relation);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
