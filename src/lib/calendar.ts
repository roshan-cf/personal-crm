import { google } from 'googleapis';

const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
};

export async function createCalendarEvent(
  contactName: string,
  frequency: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const auth = getOAuth2Client();
  
  if (!auth) {
    return { success: false, error: 'Google Calendar not configured' };
  }

  const calendar = google.calendar({ version: 'v3', auth });

  const frequencyDays: Record<string, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    yearly: 365,
  };

  const days = frequencyDays[frequency] || 7;

  try {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Reach out to ${contactName}`,
        description: `Time to connect with ${contactName} (${frequency} check-in)`,
        start: {
          date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        end: {
          date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 9 * 60 },
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

export function getGoogleAuthUrl(): string | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/calendar/callback`
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
  });
}
