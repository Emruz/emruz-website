# App pre-launch checklist (30 checks)

Run 2026-11-14 on branch `launch-audit`. Scope: the web app in this repo (emruz.com, accounts, Stripe, Netlify) and the Motiv licensing service. The Motiv desktop app is a separate repo and was not reviewed. Security rows cite `LAUNCH/security-findings.md` (local only, not in the repo) (E1 to E10, N1 to N6, or section 3) and were not re-audited here.

Status: PASS, FIXED, OPEN (someone must act; exact steps given), N/A (reason given). No code fixes were needed in this run: every open item needs a feature decision, a dashboard, or an account.

## Sign-up and accounts

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | Email verification before full access; verified provider emails only [SEC] | PASS [E1] | `src/lib/server/accounts.ts:39-47` (no account from an unverified email); admin rights need verified email |
| 2 | Password rules sane, or passkeys or OAuth | PASS | No passwords are stored. Sign-in is by OAuth (Microsoft, Google, Apple; PKCE, state, nonce) or a one-time email link. `src/lib/server/oauth.ts`, `src/app/auth/email/route.ts` |
| 3 | Rate limits on sign-up, login, reset, pairing [SEC] | PASS [E4] | `src/app/auth/email/route.ts:25` (5 per email, 20 per IP per hour); `src/app/activate/actions.ts:22-34`; `src/lib/server/api.ts:37` for licence endpoints |
| 4 | Sign-in tokens single-use and expiring [SEC] | PASS | Hashed (sha256) tokens, 20-minute expiry (`src/app/auth/email/route.ts:30`), single use via `used_at is null` (`src/app/auth/verify/confirm/route.ts:18-19`). Not listed among E1 to E10; cross-check in the next security pass. |
| 5 | Sessions expire; logout invalidates on the server [SEC] | PASS [E7] | 7-day idle expiry and 30-minute admin idle (`src/lib/server/session.ts:13-17`); sign-out deletes the row (`src/lib/server/session.ts:166`) |
| 6 | Account deletion works end to end, including third parties | OPEN | No self-service account deletion in the code (`grep` found none). Deletion is by email request (policy). The purge job removes soft-deleted engagements and assessments after retention (`netlify/functions/purge-deleted.mts:18-22`) but not accounts. Owner decision: build in-app deletion, or keep email-only and document the steps. Lawyer question 10. |

## Payments

| # | Check | Status | Evidence |
|---|---|---|---|
| 7 | Prices from server or provider, never the client | PASS | Checkout takes only a plan name, then uses a server-side price ID from env (`src/app/api/motiv/checkout/route.ts:11-18`, `src/lib/server/stripe.ts`). Quantity is fixed at 1. |
| 8 | Webhooks verified by signature and idempotent [SEC] | PASS | `constructEvent` with the raw body (`src/app/api/stripe/webhook/route.ts:22`); `stripe_events` insert for idempotency (line 29); failures logged (line 62). See findings section 3. |
| 9 | Access only after confirmed payment; seats enforced atomically | PASS [E5] | Subscription access on `checkout.session.completed` and `invoice.paid` (`webhook/route.ts:34-37`); seat lock (`licensing.ts:127`) |
| 10 | Cancellation and refund flows work and match the terms | PASS, with a LAWYER note | Cancel and billing through the Stripe portal (`src/app/api/motiv/portal/route.ts`); access ends on cancellation (commit `ed3ce93`); refunds revoke access via `charge.refunded` (`webhook/route.ts:47-49`). Refunds are issued in the Stripe dashboard after an email request. The 14-day rule needs owner confirmation (lawyer question 5). |
| 11 | Trial and auto-renewal disclosed before payment | PASS | No free trial in code (`grep` found none). Renewal now stated on the monthly and annual plan notes (`3cfec93`). |
| 12 | Receipts and tax handled by provider, or OPEN | OPEN | Receipts come from Stripe. Automatic sales tax is off for sandbox (`STRIPE_AUTOMATIC_TAX`). Owner steps, from `docs/open-items.md`: run `npx netlify env:unset STRIPE_AUTOMATIC_TAX` after the tax registrations are confirmed with the accountant. |

## Data

| # | Check | Status | Evidence |
|---|---|---|---|
| 13 | Every table or store mapped to a purpose in the policy | PASS | `LAUNCH/ropa.md` maps nine activities to purposes; `src/app/privacy/page.tsx` lists them |
| 14 | Per-user or per-tenant authorisation on every read and write [SEC] | PARTIAL, OPEN [N3, N5] | Engagement and evidence access checks in place (`src/app/api/evidence/[id]/route.ts`, layout `requireEngagementAccess`). Open: N3 (no Origin check on cookie-authenticated API routes, defence in depth) and N5 (impersonation target not checked for admin). |
| 15 | Backups exist and a restore was tested once | OPEN | Netlify Database backup settings are not in the repo, and no restore test is recorded. Owner steps: confirm the backup and retention settings in the Netlify dashboard, then restore a copy to a branch database and record the date. |
| 16 | Logs free of passwords, tokens, payment data [SEC] | PASS | Logged events hold IDs, reasons, and provider error text, not secrets (`src/lib/server/alerts.ts`, `src/lib/server/oauth.ts` error messages). Stripe card data never reaches the server. |
| 17 | Retention rule set for user data and logs | PARTIAL, OPEN | User-data retention is in the policy (table, "How long we keep it"). Purge job for soft-deleted engagements and assessments (`purge-deleted.mts`). Log retention in `LAUNCH/ropa.md` row 8 is still [[TODO]]. Owner: set the log retention in the Netlify dashboard and record it. |
| 18 | Export of a user's data possible | OPEN | No self-service export in the code. The policy promises a copy on request by email. Owner: decide whether to build an export, or write a manual procedure (look up account, subscriptions, self-assessments, and produce a JSON file within one month). |

## Safety (all [SEC], from web-app-security)

| # | Check | Status | Evidence |
|---|---|---|---|
| 19 | No secrets in repo, client bundle, or binary | PASS | `git grep` for live Stripe keys, webhook secrets, AWS and GitHub token patterns, and PEM headers found only `.env.example` placeholders (findings section 3). `.env*` is gitignored. `.env.local` was not read. |
| 20 | Dependencies audited; criticals fixed; audit in CI [SEC] | PASS [E10] | `npm audit --omit=dev --audit-level=high` returned 0 vulnerabilities; CI runs it (`.github/workflows/security.yml`) |
| 21 | Injection and output encoding [SEC] | PASS [E6] | Parameterised tagged-template queries in `postgres`; markdown sanitised (`src/lib/markdown.ts`) |
| 22 | Security headers, CSP, cookie flags [SEC] | PASS [E2] | Per-request nonce CSP (`src/proxy.ts`); HSTS, nosniff, Referrer-Policy, Permissions-Policy (`next.config.ts`); session cookie httpOnly, sameSite lax (`src/lib/server/session.ts:38-40`) |
| 23 | Function-level authorisation on every endpoint and command [SEC] | PARTIAL, OPEN [N3, N5] | Admin pages and actions check `isAdmin` and recent sign-in (findings section 3). Open: N3 and N5 as above. |
| 24 | File upload and download handling [SEC] | PASS [E8] | Byte-based type detection; inline display only for PDF and image; attachment and `no-store` otherwise; size limit `MAX_UPLOAD_BYTES` (`src/app/api/workbench/evidence/route.ts`) |
| 25 | Desktop hardening (Motiv app) | OPEN | The Motiv desktop app is in a separate repo and was not reviewed here. Owner: run web-app-security on that repo for Tauri or Electron capabilities, CSP, and keychain use. |
| 26 | Error pages and crash reports leak nothing | PASS | No custom error pages, so Next.js production defaults apply (no stack traces shown). No crash reporting SDK is in the repo (`grep` for Sentry, Bugsnag, Datadog, Crashlytics found none). |

## Distribution

| # | Check | Status | Evidence |
|---|---|---|---|
| 27 | Desktop code-signed and notarised (macOS), signed (Windows) | OPEN | `docs/open-items.md` "Downloads": signed and notarised Mac build and Windows build are not done. Owner steps: Apple Developer ID signing and notarisation, Windows code-signing certificate. |
| 28 | Auto-updates signed and verified, over HTTPS | OPEN | Not in this repo. Owner: check the Motiv desktop repo for the update channel and signature verification. |
| 29 | Mobile: store privacy labels match the inventory | N/A | No mobile app. |
| 30 | Crash reporting and telemetry match the consent | PASS (site), OPEN (desktop) | Site has no telemetry or crash reporting. Desktop check-in is disclosed in the Motiv privacy policy. Desktop telemetry and update pings need a check in the desktop repo (lawyer question 9). |

## Summary

- PASS: 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 16, 19, 20, 21, 22, 24, 26, 30 (site part)
- PARTIAL or OPEN in this repo: 6 (account deletion), 12 (tax), 14 and 23 (N3, N5), 15 (backup test), 17 (log retention), 18 (export)
- OPEN outside this repo: 25, 27, 28 (desktop app)
- N/A: 29 (no mobile app)
