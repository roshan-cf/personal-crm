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

export async function createTaskForUser(
  userId: string,
  contactName: string,
  relation: string
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  const auth = await getOAuth2ClientForUser(userId);
  
  if (!auth) {
    return { success: false, error: 'Google Tasks not connected' };
  }

  const tasks = google.tasks({ version: 'v1', auth });

  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  dueDate.setDate(dueDate.getDate() + 1);

  try {
    const task = await tasks.tasks.insert({
      tasklist: '@default',
      requestBody: {
        title: `📞 Call ${contactName}`,
        notes: `Reach out to ${contactName} (${relation})\n\nLogged from Personal CRM`,
        due: dueDate.toISOString(),
      },
    });

    return { success: true, taskId: task.data.id || undefined };
  } catch (error) {
    console.error('Error creating task:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function createTasksForDueContacts(
  userId: string,
  contacts: Array<{ name: string; relation: string }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const contact of contacts) {
    const result = await createTaskForUser(userId, contact.name, contact.relation);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
