# Security findings: verification of prior work

Verify mode, run 2026-11-14 on branch `launch-audit` at HEAD 4353b05. This is not a fresh review and not a security certification. It re-checks the fixes recorded as commits Security E1 to E10 against the current code, then reviews code changed after e9fc80c. No findings file existed on disk, so each E-commit is treated as a finding.

Assurance level: **ASVS L2** (accounts, personal data, hosted payments, licensing). Chapters not applicable: V4 (no multi-tenant admin APIs beyond the workbench roles), V17 WebRTC, V18 IoT, V5 partly (no file server beyond evidence and avatars, which are covered).

## 1. Prior fixes (E-commits) re-verified

| ID | Commit | Control | Status | Evidence | OWASP 2025 | ASVS 5.0 | CWE | SSDF | PCI DSS 4.0 |
|---|---|---|---|---|---|---|---|---|---|
| E1 | d4971cb | Verified email required to create accounts and for admin rights | fixed | `src/lib/server/accounts.ts:39-47` (no account from unverified email); `src/app/auth/verify/confirm/route.ts:49` (sign-in link sets emailVerified) | A07 | V6, V10 | 287, 640 | PW.5 | 8.2 |
| E2 | 6fc5cd2 | Security headers and nonce-based CSP | fixed | `src/proxy.ts:10-35` (per-request nonce, script-src 'strict-dynamic', frame-ancestors 'none'); `next.config.ts:5-10` (HSTS, nosniff, Referrer-Policy, Permissions-Policy) | A02 | V3, V13 | 16, 1004 | PW.9 | 6.4.1 |
| E3 | 597c9df | Restrict client contact changes | fixed | `src/app/workbench/actions.ts:81-86` (contactManager checks canManageContacts); `:92-93` (staff email rejected as client contact) | A01 | V8 | 862, 863 | PW.1 | 7.2 |
| E4 | 7bb4c59 | Rate limits and attempt lock on /activate, plus other endpoints | fixed | `src/app/activate/actions.ts:22-34` (per-account and per-IP limits); `src/app/auth/email/route.ts:25`; `src/app/api/contact/route.ts:26`; `src/lib/server/api.ts:37`; `src/lib/server/db.ts:36` (shared limiter) | A06 | V2 | 307 | PW.5 | 8.3.4 |
| E5 | f606a85 | Atomic seat check | fixed | `src/lib/server/licensing.ts:127` (`for update` lock on subscription row); `:173-179` and `:325-331` (seat count in the same transaction) | A06 | V15 | 362 | PW.5 | 6.2.4 |
| E6 | f8695de | Sanitize rendered markdown | fixed | `src/lib/markdown.ts:9-39` (sanitize-html allowlist applied to marked output) | A05 | V1 | 79 | PW.5 | 6.2.4 |
| E7 | 2a3c136 | Idle expiry, shorter admin sessions, step-up sign-in | fixed | `src/lib/server/session.ts:13-17` (7-day sliding idle, 30-minute admin idle); `:55` (fresh sign-in replaces session); `src/app/admin/users/actions.ts:11` (requireRecentSignIn) | A07 | V7 | 613 | PW.5 | 8.2.8 |
| E8 | f0764cc | Detect evidence file types from bytes | fixed | `src/lib/server/filetype.ts:3-14` (magic-byte detection, browser type ignored); `src/app/api/evidence/[id]/route.ts:33-40` (inline only for PDF and image types, otherwise attachment, nosniff, CSP sandbox, no-store) | A05 | V5 | 434 | PW.5 | 6.2.4 |
| E9 | 5068233 | Security event logging and alerts | fixed | `src/lib/server/alerts.ts` (rules, cooldown, alert email); `src/app/api/stripe/webhook/route.ts:24,62` (webhook_bad_signature, webhook_failure); `src/lib/server/db.ts:47` (rate_limited) | A09 | V16 | 778 | RV.1 | 10.2 |
| E10 | e9fc80c | CI security checks and Dependabot | fixed | `.github/workflows/security.yml` (npm audit high, lint, tsc, licensing tests, gitleaks); `.github/dependabot.yml` | A03 | V15 | 1104 | PS.1, PW.4 | 6.3.2 |

Result: 10 of 10 E-items present in code. None regressed. Note that the E-commits are the only record of these findings, so the original findings wording is not known.

## 2. Code changed since e9fc80c (54 files, reviewed)

| # | Sev | Title | Location | OWASP 2025 | ASVS 5.0 | API 2023 | CWE | SSDF | PCI DSS 4.0 | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| N1 | Info | OAuth client rewrite (4353b05) reviewed: PKCE S256 (MS, Google), state cookie bound per attempt, nonce, issuer, audience, email_verified gate, Microsoft xms_edov | `src/lib/server/oauth.ts:95-165`, `src/app/auth/callback/[provider]/route.ts` | A07 | V10.4 | n/a | 347 | PW.5 | 8.3 | pass, no issue |
| N2 | Low | Evidence download `Content-Disposition` filename strips quotes only, no RFC 5987 encoding; CR/LF in a stored filename would throw at response construction (500), not inject headers | `src/app/api/evidence/[id]/route.ts:37` | A05 | V5.4 | n/a | 113 | PW.5 | 6.2.4 | needs check (runtime test with CR/LF filename) |
| N3 | Low | Session-cookie-only CSRF defense on API route handlers (evidence upload, avatar upload, /api/me). Session cookie is SameSite=lax, which blocks cross-site POST, but no Origin check. Only checkout and portal call `sameOrigin()`. | `src/app/api/workbench/evidence/route.ts:13-17`, `src/app/api/avatar/[id]/route.ts`, `src/lib/server/session.ts:40` | A01 | V8.2, V4.1 | API5 | 352 | PW.5 | 6.2.4 | open (defense in depth) |
| N4 | Low | Public contact endpoint accepts POST from any origin with any content type (`req.json()`); rate limited 5 per IP per hour | `src/app/api/contact/route.ts:8-26` | A06 | V2.4 | API4 | 799 | PW.5 | 6.2.4 | open (spam, not data loss) |
| N5 | Info | Admin impersonation: target account is not checked for admin status | `src/lib/server/session.ts:141-148`, `src/app/admin/users/actions.ts` | A01 | V8.2.2 | API5 | 863 | PW.1 | 7.2.2 | needs check (confirm admins cannot impersonate other admins) |
| N6 | n/a | `/admin/assessments` renders no data; it redirects to `/workbench/self` | `src/app/admin/assessments/page.tsx` | n/a | n/a | n/a | n/a | n/a | n/a | not a finding |

No Critical or High findings. No open item needs an owner decision to continue, so no code changed in this run.

## 3. Checks run

- **Secrets:** `git grep` for Stripe live/test keys, webhook secrets, AWS key IDs, GitHub tokens, and PEM private keys in tracked files. Only `.env.example` placeholders and the code that formats an Apple key were found. `.env*` is ignored (`.gitignore:34`). `.env.local` was not read.
- **Dependencies:** `npm audit --omit=dev --audit-level=high` returned 0 vulnerabilities.
- **Authorization:** every `src/app/admin/*/page.tsx` (except the redirect page) calls `isAdmin`; admin actions call `isAdmin` and `requireRecentSignIn`; `src/app/workbench/e/[id]/layout.tsx` runs engagement access checks for all nested engagement pages; evidence download checks staff or client contact access.
- **Webhook:** Stripe signature verified on raw body (`constructEvent`); event IDs stored for idempotency.
- **Link evidence:** `https://` enforced server-side in both staff (`src/app/workbench/actions.ts:369`) and portal (`src/app/portal/actions.ts:19`) paths.
- **Motiv desktop endpoints:** `licensingRoute` wrapper with per-subscription rate limits; device and seat checks inside a transaction.

## 4. Coverage matrix (OWASP Top 10:2025)

| Category | Findings by severity | ASVS chapters checked | Status |
|---|---|---|---|
| A01 Broken Access Control | Low 1 (N3), Info 1 (N5) | V8, V4 | Partial (N3, N5 open or needs check) |
| A02 Security Misconfiguration | none | V3, V13 | Pass (CSP and headers; CSP not yet confirmed on the live site) |
| A03 Software Supply Chain | none | V15 | Pass (CI, Dependabot, 0 high prod vulns) |
| A04 Cryptographic Failures | none | V11, V12, V14 | Pass (randomBytes, PKCE, jose, env-only secrets) |
| A05 Injection | Low 1 (N2) | V1, V2, V5 | Pass with one check (N2) |
| A06 Insecure Design | Low 1 (N4) | V2, V15 | Pass (E4, E5) |
| A07 Authentication Failures | none | V6, V7, V9, V10 | Pass (E1, E7, OAuth review) |
| A08 Integrity Failures | none | V2, V4, V15 | Pass (Stripe webhook verified and idempotent) |
| A09 Logging and Alerting | none | V16 | Pass (E9) |
| A10 Exceptional Conditions | none | V16, V15 | Pass (fail-closed on signature and seat checks; transactions) |

## 5. Framework rollup (short form)

- **OWASP API Top 10:2023:** API1 Pass (scoped queries), API2 Pass (E1, E7), API4 Partial (N4), API5 Partial (N3, N5), API8 Pass (headers, sanitize), API10 Pass (dependency audit).
- **ASVS 5.0 L2:** V1, V2 Partial (N4), V3 Pass, V5 Partial (N2), V6 Pass, V7 Pass, V8 Partial (N3, N5), V10 Pass (N1), V11 Pass, V13 Pass, V15 Pass, V16 Pass.
- **NIST SSDF:** PW.5, PW.9, PS.1, PW.4 covered by E2, E6, E10. RV.1 covered by E9.
- **PCI DSS 4.0:** Stripe hosted checkout keeps card data off the site. 6.4.1, 8.2, 8.3 covered by E1, E4, E7. Full PCI scoping not done here.

## 6. Not reviewed

- Live deployment: whether CSP and headers reach emruz.com (needs a live curl of the response headers).
- Netlify Database role permissions, Netlify Blobs access policy, and Resend domain settings.
- Motiv desktop app (separate repo): code signing, notarization, and update checks.
- Full evidence-upload stress tests and the N2 runtime test.
- The `/motiv/*` and self-assessment pages were checked by pattern, not line by line.
- No penetration testing. Test only systems the owner controls.

## Recommended next step (owner decision, not run here)

Fix N3 by adding `sameOrigin()` to the evidence upload, avatar upload, and `/api/me` handlers, as the checkout route already does. This is a small change to three files; it was not made in this verify-only run.
