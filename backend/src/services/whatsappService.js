import twilio from 'twilio';
import { env } from '../config/env.js';

export async function sendInvoiceWhatsApp({ mobile, message, pdfUrl }) {
  if (!mobile) return { status: 'failed', providerId: null, reason: 'Missing customer mobile' };

  if (env.whatsappProvider !== 'twilio') {
    console.log(`[mock-whatsapp] ${mobile}: ${message} ${pdfUrl || ''}`);
    return { status: 'mock_sent', providerId: `mock-${Date.now()}` };
  }

  const client = twilio(env.twilio.accountSid, env.twilio.authToken);
  const to = mobile.startsWith('whatsapp:') ? mobile : `whatsapp:${mobile}`;
  const payload = {
    from: env.twilio.from,
    to,
    body: `${message}\n${pdfUrl || ''}`.trim()
  };
  const result = await client.messages.create(payload);
  return { status: 'sent', providerId: result.sid };
}
