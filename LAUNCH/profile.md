# Launch profile

Saved by /launch-kit. Answers come from the owner's survey and a repo scan on the `chore/replace-arctic` branch (base commit 4353b05). Unknowns are marked [[TODO]].

## Survey answers

| Question | Answer |
|---|---|
| Stage | First audit, already live (deployed to emruz.com on Netlify) |
| Type | Web app (accounts, client workbench, billing) plus Motiv desktop app (separate repo, distributed separately) |
| Markets | US-California, other US, EU, UK |
| Data collected | Accounts, contact forms, newsletter, payments. Also evidence file uploads and security event logs (found in scan). |
| Money | Subscription plus one-time (Motiv monthly, annual, lifetime) |
| AI | None in this repo. Motiv's on-device AI is a separate product (see Scan notes). |
| How it ships | Hosted (Netlify) plus desktop installers (Motiv, Mac and Windows) |
| Name | Not checked (Emruz, Motiv) |
| Security review | Recent review, fixes done. No findings file on disk; commits Security E1 to E10 are the fixes. |
| Mode | Fix and draft |
| Entity | Code sets legal party "Shahin Pirooz, doing business as Emruz", Santa Clara, California, USA (`src/components/LegalPage.tsx:4`). Owner to confirm this is correct, and whether an LLC exists. Contact: info@emruz.com. Refund rule: 14 days, full refund on first purchase (in terms and pricing page). Owner to confirm. |

## Scan notes

- **Stack:** Next.js 16.4.6, React 19.3.1, TypeScript 6, Tailwind 4. Postgres via Netlify Database (migrations 001 to 014). Netlify Functions (`netlify/functions/purge-deleted.mts`) and Netlify Blobs for avatars.
- **Hosting:** Netlify, production URL https://emruz.com (`netlify.toml`).
- **Auth:** Email sign-in links via Resend. OAuth for Google, Microsoft, and Apple (Apple not yet configured per open-items). Custom OAuth client on jose and Node crypto (commit 4353b05).
- **Payments:** Stripe (checkout, customer portal, webhook at `src/app/api/stripe/webhook/route.ts`). Sandbox keys still in use; live cutover is a go-live item in `docs/open-items.md`.
- **Email:** Resend (`api.resend.com`). Contact form to CONTACT_TO / info@emruz.com.
- **Forms:** contact, newsletter (insights subscribe), account, workbench intake, self-assessment register, Motiv activation, admin.
- **Uploads:** evidence files up to the MAX_UPLOAD_BYTES limit, type checked from bytes (`src/lib/server/filetype.ts`). Avatars too.
- **Cookies:** httpOnly session cookie (`src/lib/server/session.ts`, sameSite lax) and short-lived OAuth state cookies (`src/app/auth/[provider]/route.ts`, sameSite none in prod).
- **Trackers and analytics:** none found in `src/`, `scripts/`, or `netlify/`. Google Fonts and external-host fetches are limited to the OAuth providers, Stripe, Resend, LinkedIn, and GitHub links.
- **AI calls:** none found in the site code. Motiv marketing copy says "your audio never leaves" the user's computer.
- **Security baseline already in code:** security headers and nonce-based CSP (E2), rate limits (E4), idle expiry and step-up sign-in (E7), markdown sanitization (E6), byte-based file type detection (E8), security event logging and alerts (E9), CI audit, lint, and gitleaks (E10, `.github/workflows/security.yml`).
- **Existing legal pages:** /privacy, /terms, /motiv/privacy, /motiv/eula (drafted and live; open-items says a lawyer review is pending).
- **No LAUNCH/ folder** existed before this run.
