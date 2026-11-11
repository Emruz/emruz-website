import { clientIp } from '@/lib/server/api';
import { db, rateLimit } from '@/lib/server/db';
import { sendEmail } from '@/lib/server/email';
import { EMAIL_RE } from '@/lib/server/newsletter';

const field = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  // Spam trap: pretend success so bots move on
  if (field(body.website, 200)) return Response.json({ ok: true });

  const name = field(body.name, 120);
  const email = field(body.email, 254).toLowerCase();
  const company = field(body.company, 160);
  const topic = field(body.topic, 120);
  const message = field(body.message, 5000);
  if (!name || !EMAIL_RE.test(email) || !message) return Response.json({ ok: false, error: 'invalid' }, { status: 400 });

  const ip = clientIp(req);
  if (!(await rateLimit(`contact:${ip}`, 5, 3600))) return Response.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  const [row] = await db()<{ id: string }[]>`
    insert into contact_messages (name, email, company, topic, message, ip)
    values (${name}, ${email}, ${company || null}, ${topic || null}, ${message}, ${ip}) returning id`;

  try {
    await sendEmail(
      process.env.CONTACT_TO || 'info@emruz.com',
      `Website message${topic ? `: ${topic}` : ''} from ${name}`,
      `Name: ${name}\nEmail: ${email}\nCompany: ${company || '-'}\nTopic: ${topic || '-'}\n\n${message}\n`,
      { replyTo: email },
    );
    await db()`update contact_messages set emailed = true where id = ${row.id}`;
  } catch (e) {
    // The message is saved, so the visitor still gets a success; it shows on the admin page
    console.error('contact email failed', e);
  }
  return Response.json({ ok: true });
}
