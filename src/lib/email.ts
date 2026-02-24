import { Resend } from 'resend';
import type { ContactWithLastInteraction } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #f4f4f5;">
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Personal CRM</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your verification code</p>
        </div>
        
        <div style="background: white; border-radius: 16px; padding: 48px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
            Enter this code to sign in:
          </p>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: inline-block; padding: 20px 48px; border-radius: 12px;">
            <span style="font-size: 36px; font-weight: 700; color: white; letter-spacing: 8px;">${otpCode}</span>
          </div>
          <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0 0;">
            This code expires in 5 minutes.
          </p>
        </div>
        
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 32px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'Personal CRM <onboarding@resend.dev>',
      to: email,
      subject: `Your verification code: ${otpCode}`,
      html,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendDailyReminder(
  email: string,
  dueContacts: ContactWithLastInteraction[]
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!dueContacts.length) {
    return { success: true };
  }

  const contactsList = dueContacts
    .map((c) => {
      const daysText = c.days_since_interaction === null 
        ? 'never' 
        : `${c.days_since_interaction} day${c.days_since_interaction !== 1 ? 's' : ''} ago`;
      return `<li style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
        <strong style="color: #1a1a1a;">${c.name}</strong> 
        <span style="background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">${c.category}</span>
        <br/><span style="color: #666;">${c.relation}</span>
        <br/><small style="color: #999;">Last contact: ${daysText}</small>
      </li>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #f4f4f5;">
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Personal CRM</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Time to nurture your relationships</p>
        </div>
        
        <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
            You have <strong style="color: #667eea;">${dueContacts.length}</strong> contact${dueContacts.length !== 1 ? 's' : ''} to reach out to today:
          </p>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${contactsList}
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://personal-crm.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500;">Open Personal CRM</a>
        </div>
        
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 32px;">
          Stay connected, stay meaningful.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: 'Personal CRM <onboarding@resend.dev>',
      to: email,
      subject: `${dueContacts.length} contact${dueContacts.length !== 1 ? 's' : ''} to reach out to today`,
      html,
    });
    
    console.log('Email sent successfully:', response);
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
