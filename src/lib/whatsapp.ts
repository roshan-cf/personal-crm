const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

interface SendMessageParams {
  to: string;
  message: string;
}

export async function sendWhatsAppMessage({ to, message }: SendMessageParams): Promise<{ success: boolean; error?: string }> {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('[WhatsApp] Not configured - set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const formattedNumber = to.replace(/\D/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp] Send failed:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('[WhatsApp] Message sent:', result.messages?.[0]?.id);
    return { success: true };
  } catch (error) {
    console.error('[WhatsApp] Error:', error);
    return { success: false, error: String(error) };
  }
}

export function formatReminderMessage(contactName: string): string {
  return `Hi! Just a reminder to reach out to ${contactName} today. Keep your relationships strong! 💪`;
}

export async function sendBulkWhatsAppMessages(
  contacts: Array<{ name: string; phone?: string }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const contact of contacts) {
    if (!contact.phone) {
      failed++;
      continue;
    }

    const result = await sendWhatsAppMessage({
      to: contact.phone,
      message: formatReminderMessage(contact.name),
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  return { sent, failed };
}
