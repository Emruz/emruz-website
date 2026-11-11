import 'server-only';
import { IS_PROD } from './config';

// Sends transactional email through Resend (RESEND_API_KEY, EMAIL_FROM).
// Without a key in development the message is printed to the server log.

export async function sendEmail(to: string, subject: string, text: string, opts: { replyTo?: string } = {}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (IS_PROD) throw new Error('RESEND_API_KEY is not set');
    console.log(`\n--- email to ${to}: ${subject}\n${text}\n---\n`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Emruz <no-reply@emruz.com>',
      to: [to],
      subject,
      text,
      reply_to: opts.replyTo || process.env.EMAIL_REPLY_TO || 'info@emruz.com',
    }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
}
