import { Resend } from 'resend';
import type { ContactWithLastInteraction } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDailyReminder(
  email: string,
  dueContacts: ContactWithLastInteraction[]
): Promise<{ success: boolean; error?: string }> {
  if (!dueContacts.length) {
    return { success: true };
  }

  const contactsList = dueContacts
    .map((c) => {
      const daysText = c.days_since_interaction === null 
        ? 'never' 
        : `${c.days_since_interaction} day${c.days_since_interaction !== 1 ? 's' : ''} ago`;
      return `<li><strong>${c.name}</strong> (${c.category}) - ${c.relation}<br/><small>Last contact: ${daysText}</small></li>`;
    })
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Personal CRM Reminder</h1>
      <p style="color: #666; font-size: 16px;">You have <strong>${dueContacts.length}</strong> contact${dueContacts.length !== 1 ? 's' : ''} to reach out to today:</p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        ${contactsList}
      </ul>
      <p style="color: #888; font-size: 14px; margin-top: 30px;">
        <a href="https://personal-crm.vercel.app" style="color: #0066cc;">Open Personal CRM</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'Personal CRM <onboarding@resend.dev>',
      to: email,
      subject: `${dueContacts.length} contact${dueContacts.length !== 1 ? 's' : ''} to reach out to today`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
