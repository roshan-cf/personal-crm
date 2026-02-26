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
  relation: string,
  contactId?: number
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

    const taskId = task.data.id;

    if (taskId && contactId) {
      const db = getDb();
      await db.execute({
        sql: `INSERT INTO interactions (user_id, contact_id, interacted_at, google_task_id) VALUES (?, ?, ?, ?)`,
        args: [userId, contactId, now.toISOString(), taskId],
      });
    }

    return { success: true, taskId: taskId || undefined };
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
  contacts: Array<{ name: string; relation: string; contactId?: number }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const contact of contacts) {
    const result = await createTaskForUser(userId, contact.name, contact.relation, contact.contactId);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

export async function syncCompletedTasks(userId: string): Promise<{ synced: number }> {
  const auth = await getOAuth2ClientForUser(userId);
  
  if (!auth) {
    return { synced: 0 };
  }

  const db = getDb();
  
  const pendingTasks = await db.execute({
    sql: `SELECT id, contact_id, google_task_id FROM interactions WHERE user_id = ? AND google_task_id IS NOT NULL`,
    args: [userId],
  });

  if (pendingTasks.rows.length === 0) {
    return { synced: 0 };
  }

  const tasks = google.tasks({ version: 'v1', auth });
  let synced = 0;

  for (const row of pendingTasks.rows) {
    const interactionId = row.id as number;
    const taskId = row.google_task_id as string;

    try {
      const task = await tasks.tasks.get({
        tasklist: '@default',
        task: taskId,
      });

      if (task.data.status === 'completed') {
        synced++;
        await db.execute({
          sql: `DELETE FROM interactions WHERE id = ?`,
          args: [interactionId],
        });
      }
    } catch (error) {
      console.error('Error checking task status:', error);
    }
  }

  return { synced };
}
