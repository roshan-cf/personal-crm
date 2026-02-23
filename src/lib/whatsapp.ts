import twilio from 'twilio';
import type { ContactWithLastInteraction } from '@/types';

export function sendWhatsAppReminder(
  phoneNumber: string,
  dueContacts: ContactWithLastInteraction[]
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return Promise.resolve({ success: false, error: 'Twilio not configured' });
  }

  if (!dueContacts.length) {
    return Promise.resolve({ success: true });
  }

  const client = twilio(accountSid, authToken);

  const contactNames = dueContacts.map((c) => c.name).join(', ');
  const message = `Personal CRM Reminder: You have ${dueContacts.length} contact${dueContacts.length !== 1 ? 's' : ''} to reach out to today:\n\n${contactNames}`;

  return client.messages
    .create({
      from: fromNumber,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    })
    .then(() => ({ success: true }))
    .catch((error: unknown) => ({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
}
