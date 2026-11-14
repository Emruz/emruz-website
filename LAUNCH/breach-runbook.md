# Personal data breach runbook

Draft by /launch-kit, 2026-11-14. Covers GDPR and UK GDPR (notify the supervisory authority within 72 hours of becoming aware, Art. 33) and California's breach notice law (Cal. Civ. Code 1798.82, notify affected residents without unreasonable delay). Counsel to confirm the timelines and forms. [[TODO]] marks details the owner must fill in.

## Contacts (owner to fill in)

- Incident lead: [[TODO]] (name and phone)
- Hosting support: Netlify support (via dashboard)
- Payments: Stripe support (via dashboard)
- Email provider: Resend support (via dashboard)
- Legal counsel: [[TODO]]
- EU or UK representative (if appointed): [[TODO]]
- Lead supervisory authority, EU (if the company is established in the EU): [[TODO]] (none is expected; counsel to confirm)
- UK: Information Commissioner's Office (ICO), breach reporting form on ico.org.uk
- California: Attorney General breach notice portal, if more than 500 California residents are affected (confirm with counsel)

## 1. Detect (hour 0)

Sources: security alerts already sent by the site to the owner's email (`src/lib/server/alerts.ts`: sign-in failure spikes, webhook signature failures, rate-limit spikes), Netlify deploy and function logs, Stripe dashboard alerts, a user or researcher report at info@emruz.com.

- Record the time you first became aware. The 72-hour clock starts then.
- Open an incident log (date, time, what, who, what was done). Keep it outside the repo.

## 2. Contain (hours 0 to 4)

- Revoke or rotate any exposed secret: Stripe keys, Resend key, OAuth client secrets, the Motiv license signing key (see `docs/open-items.md`).
- Sign out affected sessions if sessions may be stolen (session records are in the database).
- Disable the affected endpoint if needed. Do not delete logs.
- Preserve evidence: copy relevant logs before they rotate.

## 3. Assess (within 24 hours)

Answer these and record the answers:

1. What data was affected (categories, not just counts)? Account, billing, contact, evidence files, self-assessment answers?
2. How many people, and where do they live (EU, UK, California)?
3. Was the data encrypted or hashed? Were the keys exposed too?
4. Is the risk to people likely (identity theft, fraud, distress, loss of confidential client information)?
5. Was there any unauthorised access to evidence files that clients uploaded?

Risk to people is likely: notify the supervisory authority (within 72 hours) and the affected people without undue delay. Risk unlikely: record the reason and do not notify.

## 4. Notify (within 72 hours where required)

- **Regulator (EU and UK):** report with the facts known so far; update later. Include the categories, approximate numbers, likely consequences, and measures taken.
- **Affected people:** plain language, what happened, what data, what they should do, contact details. Email from the sender address used for sign-in.
- **California residents:** notice under 1798.82 with its required content. Notify the Attorney General if the threshold applies (counsel to confirm).
- **Clients (processor role, activity 7 in `ropa.md`):** notify the controller client without undue delay, under the engagement agreement. Counsel to confirm the contract clause.

## 5. Recover and learn (within 2 weeks)

- Root cause, the fix, and a commit or change reference for each control added.
- Update `LAUNCH/security-findings.md` with any new finding.
- Update this runbook if a step was unclear or missing.
- Keep the incident log and notices for at least the period required by counsel (default: 5 years, to be confirmed).

## Testing

Run a tabletop exercise once a year: pick one scenario (for example, a leaked Stripe key), walk through steps 1 to 5 with the owner, and record the time taken.
