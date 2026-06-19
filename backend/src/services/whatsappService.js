import twilio from 'twilio';
import { env } from '../config/env.js';

function formatWhatsAppNumber(mobile) {
  const raw = String(mobile || '').trim();
  const withoutChannel = raw.startsWith('whatsapp:') ? raw.slice('whatsapp:'.length) : raw;
  const compact = withoutChannel.replace(/[\s()-]/g, '');

  if (/^\d{10}$/.test(compact)) return `whatsapp:+91${compact}`;
  if (/^91\d{10}$/.test(compact)) return `whatsapp:+${compact}`;
  if (compact.startsWith('+')) return `whatsapp:${compact}`;
  return raw.startsWith('whatsapp:') ? raw : `whatsapp:${compact}`;
}

export async function sendInvoiceWhatsApp({ mobile, message, pdfUrl }) {
  if (!mobile) return { status: 'failed', providerId: null, reason: 'Missing customer mobile' };

  if (env.whatsappProvider !== 'twilio') {
    console.log(`[mock-whatsapp] ${mobile}: ${message} ${pdfUrl || ''}`);
    return { status: 'mock_sent', providerId: `mock-${Date.now()}` };
  }

  if (!env.twilio.accountSid || !env.twilio.authToken || !env.twilio.from) {
    return { status: 'failed', providerId: null, reason: 'Twilio WhatsApp credentials are incomplete' };
  }

  const client = twilio(env.twilio.accountSid, env.twilio.authToken);
  const to = formatWhatsAppNumber(mobile);
  const payload = {
    from: env.twilio.from,
    to,
    body: `${message}\n${pdfUrl || ''}`.trim()
  };
  try {
    const result = await client.messages.create(payload);
    return { status: 'sent', providerId: result.sid };
  } catch (error) {
    const reason = error?.message || 'Twilio WhatsApp message failed';
    console.error(`[twilio-whatsapp] ${reason}`);
    return { status: 'failed', providerId: error?.code || null, reason };
  }
}
