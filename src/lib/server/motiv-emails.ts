import 'server-only';
import { SITE_URL } from './config';
import { sendEmail } from './email';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The email a new Motiv Pro subscriber gets, bought or granted. Walks someone
 * who has never seen Motiv from download to an activated computer.
 */
export function motivProEmail(subscriptionId: string, intro?: string) {
  const download = `${SITE_URL}/motiv/download`;
  const activate = `${SITE_URL}/activate`;
  const account = `${SITE_URL}/motiv/account`;
  const subject = 'Your Motiv Pro subscription is ready';

  const text = `Your Motiv Pro subscription is ready!
${intro ? `\n${intro}\n` : ''}
Subscription ID: ${subscriptionId}

Get started in three steps

1. Download and install Motiv
   ${download}
   The page picks the right file for your computer.

2. Open Motiv, go to Settings > License and choose "Register this computer".

3. Activate Pro in one of two ways:
   - Sign in at ${activate} with this email address and enter the code Motiv shows, or
   - Paste your subscription ID (above) into Motiv.

Manage your subscription
View your plan, computers and receipts at ${account}

Enjoy Motiv Pro!
The Emruz Team`;

  const p = 'margin:0 0 16px;font-size:16px;line-height:1.5;color:#374151';
  const a = 'color:#1d4ed8;font-weight:600';
  // nosemgrep: javascript.lang.security.html-in-template-string intro is esc()'d
  const introHtml = intro ? `<p style="${p}">${esc(intro)}</p>` : '';
  // nosemgrep: javascript.lang.security.html-in-template-string every interpolated value is esc()'d or a SITE_URL constant
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px">
<h1 style="margin:0 0 16px;font-size:24px;color:#111827">Your Motiv Pro subscription is ready!</h1>
${introHtml}
<p style="${p}">Subscription ID<br><span style="font-family:Menlo,Consolas,monospace;font-size:18px;font-weight:700;color:#111827">${esc(subscriptionId)}</span></p>
<h2 style="margin:24px 0 12px;font-size:18px;color:#111827">Get started in three steps</h2>
<p style="${p}"><strong>1. Download and install Motiv.</strong> The page picks the right file for your computer.</p>
<p style="margin:0 0 20px"><a href="${download}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px">Download Motiv</a></p>
<p style="${p}"><strong>2. Open Motiv,</strong> go to Settings &gt; License and choose <strong>Register this computer</strong>.</p>
<p style="${p}"><strong>3. Activate Pro</strong> in one of two ways:</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:1.5;color:#374151">
<li>Sign in at <a href="${activate}" style="${a}">emruz.com/activate</a> with this email address and enter the code Motiv shows, or</li>
<li>Paste your subscription ID (above) into Motiv.</li>
</ul>
<h2 style="margin:24px 0 12px;font-size:18px;color:#111827">Manage your subscription</h2>
<p style="${p}">View your plan, computers and receipts at <a href="${account}" style="${a}">emruz.com/motiv/account</a>.</p>
<p style="margin:24px 0 0;font-size:16px;line-height:1.5;color:#374151">Enjoy Motiv Pro!<br>The Emruz Team</p>
</div></body></html>`;

  return { subject, text, html };
}

export async function sendMotivProEmail(to: string, subscriptionId: string, intro?: string) {
  const m = motivProEmail(subscriptionId, intro);
  await sendEmail(to, m.subject, m.text, { html: m.html });
}
