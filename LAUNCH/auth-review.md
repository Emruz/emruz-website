# Auth code review

## 1. Scope
- Repo: Emruz/emruz-website, branch feature/security-scan, commit 002dfb6 (uncommitted changes in .github/workflows/security.yml and .gitignore were not reviewed). Date: 2026-11-21.
- ASVS level: L2. Stack: Next.js 16.4.6 on Netlify, Postgres (postgres 4.1), jose ^6.2.16. Custom auth: Microsoft, Google, Apple OIDC; email magic links; hashed session tokens; admin step-up; view-as.
- Lanes: OAuth, Sessions, Magic links and view-as, Abuse. Credentials: N/A (no passwords, OTP, passkeys or API keys).
- Lanes ran as isolated agents with only their brief, files and checklist. Two verifier agents checked every finding.
- Files: src/lib/server/{oauth,session,accounts,db,api,email,config,alerts,lease}.ts; src/app/auth/*; src/app/signin/*; src/app/admin/{users,motiv,insights}/actions.ts; src/app/workbench/actions.ts; src/app/account/actions.ts; src/app/api/me/route.ts; src/proxy.ts; src/components/{SessionGuard,AccountMenu}.tsx; migrations 001, 002, 011, 012; netlify/functions/purge-deleted.mts; next.config.ts; netlify.toml.
- Added beyond the starting list: admin/users/actions.ts (view-as start), db.ts (rate limiter), accounts.ts (account linking), lease.ts (token generator), the signin pages, the admin actions (step-up callers) and the purge function.

## 2. Summary
37 raw findings from 4 lanes. 3 dropped, 4 merged as duplicates. 30 remain: 1 High, 8 Medium, 13 Low, 8 Info (grouped as AUTH-23). Two Low are "needs check".

Top risks:
- AUTH-1 (High): an admin in view-as can attach their own email or provider to any account, including the permanent admin, and keep access after their grant is revoked.
- AUTH-2: a tab or newline in `next` gives an open redirect after sign-in.
- AUTH-3: a verified email at any provider silently links into the matching account, admins included.
- AUTH-6, AUTH-7: a borrowed session can add an email with no step-up, and nothing can revoke other sessions.
- AUTH-8: anyone can block email sign-in for any address.

## 3. Findings

| ID | Sev | Title | Location | OWASP 2025 | ASVS 5.0 | API 2023 | CWE | Fix |
|---|---|---|---|---|---|---|---|---|
| AUTH-1 | High | View-as can add sign-in methods to the target | email/route.ts:22-30; verify/confirm/route.ts:27-29; accounts.ts:99-102; [provider]/route.ts:17; callback/[provider]/route.ts:59-60 | A01 | V8 | API5 | 863 | Refuse claim, add-email and link flows when impersonatedBy is set |
| AUTH-2 | Medium | Open redirect via control characters in `next` | session.ts:189-191; callback/[provider]/route.ts:66; verify/confirm/route.ts:52; signin/page.tsx:22-24 | A01 | V3, V10 | n/a | 601 | Reject control chars and backslash, parse, compare origin |
| AUTH-3 | Medium | Silent auto-link by verified email, admins included | accounts.ts:38-42, 53-59, 66-71; session.ts:177-186 | A07 | V10, V6 | API2 | 287 | No auto-link; require sign-in with an existing method, then link |
| AUTH-4 | Medium | Magic link not bound to requesting browser | verify/page.tsx:7-23; verify/confirm/route.ts:49-52; accounts.ts:92-97 | A07 | V6, V7 | n/a | 352 | Browser-binding cookie; show the email when it is missing |
| AUTH-5 | Medium | View-as outlives the admin's session and rights | session.ts:86, 103-110, 145, 178 | A07 | V7, V8 | n/a | 613 | Tie the impersonation row to the admin session; re-check admin on each request |
| AUTH-6 | Medium | Email add needs no recent sign-in | account/actions.ts:20-26, 70-92; verify/confirm/route.ts:35-39 | A07 | V6, V7 | API2 | 306 | requireRecentSignIn on add, default and remove; notify old address |
| AUTH-7 | Medium | No way to revoke other sessions | session.ts:162-169; account/actions.ts:95-125 | A07 | V7 | API2 | 613 | Sign out everywhere; revoke others on email or identity change |
| AUTH-8 | Medium | Targeted lockout of email sign-in | email/route.ts:25-26, 43-44; db.ts:36-43 | A06 | V2, V6 | API4 | 799 | Check IP limit first; count only sends; prefer a short delay to a block |
| AUTH-9 | Medium | No global or daily email send cap | email/route.ts:25-37; db.ts:35-43; email.ts:14-26 | A06 | V2 | API4 | 770 | Global hourly and daily caps that fail closed and alert; daily per-recipient cap |
| AUTH-10 | Low | Linking while impersonating can escalate the target | see AUTH-1 (OAuth path), accounts.ts:66-68 | A01 | V8, V10 | n/a | 863 | Fixed by AUTH-1 |
| AUTH-11 | Low | Unverified Microsoft email blocks addEmail | oauth.ts:164-169; accounts.ts:32, 66-68, 129-134 | A07 | V10 | n/a | 287 | Store email only when verified, or filter on email_verified |
| AUTH-12 | Low | Re-sign-in during view-as leaves admin cookie usable | session.ts:53-60, 151-160 | A07 | V7 | n/a | 384 | Delete the old row and admin cookie in createSession; check ownership on switch-back |
| AUTH-13 | Low | No `__Host-` prefix on session cookies (needs check) | session.ts:8, 10, 37-43 | A07 | V3, V7 | n/a | 1275 | Rename to `__Host-` cookies |
| AUTH-14 | Low | Admin drafts stay in localStorage after sign-out | SessionGuard.tsx:17, 53-64 | A04 | V14 | n/a | 922 | sessionStorage or clear on sign-out |
| AUTH-15 | Low | View-as has no target role check | admin/users/actions.ts:12-14; session.ts:141-148 | A01 | V8 | API5 | 269 | Refuse admin and staff targets |
| AUTH-16 | Low | Actions during view-as logged without the admin | accounts.ts:69, 104; switch-back/route.ts:9-13 | A09 | V16 | n/a | 778 | Log the actor whenever impersonatedBy is set |
| AUTH-17 | Low | Magic links live 20 min; siblings stay valid | email/route.ts:28-30; account/actions.ts:78-80; verify/confirm/route.ts:17-20 | A07 | V6 | n/a | 613 | 15 min; invalidate siblings on issue and use |
| AUTH-18 | Low | Rate-limit key not normalised | email/route.ts:14, 25 | A06 | V2 | API4 | 799 | Canonical key (strip +tag, Gmail dots) |
| AUTH-19 | Low | Client IP falls back to X-Forwarded-For (needs check) | api.ts:11-13 | A06 | V2 | API4 | 348 | Trust only x-nf-client-connection-ip in production |
| AUTH-20 | Low | Unlimited failure-path writes, no cleanup | verify/confirm/route.ts:17-23; callback/[provider]/route.ts:37-52; db.ts:36-43; purge-deleted.mts:16-22 | A10 | V2 | API4 | 770 | Per-IP limits on confirm and callback; scheduled purge |
| AUTH-21 | Low | Unescaped provider error text in logs | callback/[provider]/route.ts:39, 43-44, 68 | A09 | V16 | n/a | 117 | Strip CR/LF and cap length; log error code only |
| AUTH-22 | Low | Unbounded OAuth state cookies | [provider]/route.ts:19-31 | A06 | V2 | API4 | 770 | Cap pending cookies, or store attempts server-side |
| AUTH-23 | Info | Batch of hardening notes | see section 3.2 | various | various | n/a | various | see 3.2 |

### 3.1 Detail

**AUTH-1 (High). View-as can add sign-in methods to the target.** Was LINK-1, with OAUTH-3 merged in.
- Preconditions: an admin account (a staff grant is enough) that has signed in within the last 60 minutes.
- Attack steps:
  1. Run view-as on target T, which can be the ADMIN_EMAILS account.
  2. POST /auth/email with purpose=claim and the attacker's address. currentAccount() returns T, so the token is stored for T.
  3. Open the link in the same browser. The confirm check `current.id === t.account_id` passes, and claimEmail adds a verified email identity to T.
  4. Or open /auth/google?link=1, which attaches the admin's own Google identity to T.
  5. Switch back. Later, sign in with that email and you are in T. This still works after the admin grant is revoked.
- Impact: lasting takeover of any account. A revocable admin can make themselves the permanent admin.
- Verifier note: confirmed, all lines checked.

**AUTH-2 (Medium). Open redirect.** Was OAUTH-1, with LINK-3 merged in.
- Attack steps:
  1. Send `/auth/google?next=/%09/evil.example`.
  2. safeNext accepts `"/\t/evil.example"`.
  3. `new URL()` strips the tab, which leaves `//evil.example`, so after sign-in the browser goes to `https://evil.example/`.
- The same sink is reached through the magic-link `next` value and through signin/page.tsx:24 for users who are already signed in.
- Verifier note: confirmed by a Node test. Its original line citations were wrong and have been corrected.

**AUTH-3 (Medium). Auto-link by verified email.** Was OAUTH-2.
- Preconditions: the attacker has a provider identity whose verified email equals the victim's. Examples: a recycled mailbox, a lapsed domain, a tenant they administer.
- Attack steps:
  1. Sign in with that identity.
  2. accounts.ts:40 matches the existing account by email and inserts the identity.
  3. The attacker now has a session as the victim. If the email is in ADMIN_EMAILS, they also have admin rights.
- Verifier note: confirmed. The "account already exists" branch at line 53 is effectively dead code.

**AUTH-4 (Medium). Login CSRF through magic links.** Was LINK-4.
- Attack steps:
  1. The attacker requests a sign-in link for their own address.
  2. The victim opens /auth/verify?token=... and presses Continue.
  3. The victim is now signed in as the attacker. If the victim then claims their own purchase email, their account is merged into the attacker's account.
- Verifier note: confirmed. It takes several victim actions.

**AUTH-5 (Medium). View-as session lifetime.** Was LINK-5.
- Attack steps: revoke the admin's grant, or let their admin session expire. The impersonation session keeps working for up to 8 hours without admin idle limits, and the AUTH-1 path stays open.
- Verifier note: confirmed.

**AUTH-6 (Medium). Email add needs no step-up.** Was SESS-2.
- Attack steps:
  1. With a borrowed session, call addEmailAddress with the attacker's address.
  2. Confirm the link in the same browser.
  3. Sign in by email link at any time after that.
- The old address gets no notice when an email is added.
- Verifier note: confirmed.

**AUTH-7 (Medium). No revoke-all.** Was SESS-1. Sign-out deletes only the current browser's rows. A stolen session survives the victim's recovery steps for up to 30 days, or until 7 days idle. Verifier note: confirmed. A grep finds no delete by account_id.

**AUTH-8 (Medium). Lockout.** Was ABUSE-1.
- Attack steps:
  1. Use up your own IP's budget.
  2. Keep sending requests for the victim's email, about 6 an hour.
- The per-recipient counter increments before the IP check fails, so no link is ever sent. The response is the same either way.
- Verifier note: confirmed.

**AUTH-9 (Medium). No global email cap.** Was ABUSE-2. With rotating IPs an attacker can use up the Resend quota, and then email sign-in fails for everyone. Needs check: the Resend plan limit.

**AUTH-10 to AUTH-22** are detailed in the lane outputs. Each one was confirmed by a verifier with the file:line shown in the table.

### 3.2 Info (AUTH-23)
- ID token: no `algorithms` or `clockTolerance` passed (oauth.ts:132). jose blocks `none`. Hardening only.
- Apple: no PKCE (oauth.ts:110-120, 156). Nonce and state cover the gap.
- Apple form_post drops the Lax session cookie, so a link attempt becomes a sign-in and leaves an orphan session row (callback/[provider]/route.ts:59, 65, 79-84; session.ts:53-60).
- Expired sessions are never purged, and there is no index on sessions(account_id) (001_motiv.sql:26-31).
- The view-as indicator is only inside the menu, and switch-back disappears once the target session ends (AccountMenu.tsx:107-111, 143-153, 164, 178-182).
- The step-up window is 60 minutes (session.ts:19).
- The full email address is in the /signin/check-email URL (email/route.ts:44).
- The rate_limited alert is fire-and-forget and may be dropped (db.ts:45-48).

## 4. Checked, no finding
- OAuth: state is 256 bits, cookie-bound, compared and single use (callback/[provider]/route.ts:55-60). PKCE S256 for Microsoft and Google. The nonce is checked (oauth.ts:142). redirect_uri comes from config. JWKS signature, `aud`, exact `iss` per provider, and Microsoft `tid` are checked (oauth.ts:125-141). Identities are keyed on (provider, sub). The Apple client secret is ES256 with a 5-minute expiry. Provider tokens are not stored.
- Sessions: the token is randomBytes(32), base64url (lease.ts:99-101). Only the SHA-256 is stored, and it is the primary key. Cookies are HttpOnly, Secure in production, SameSite=Lax, Path=/. Absolute (30d) and idle (7d) limits are checked in SQL on every read. Admin sessions are limited to 12h, 120 minutes idle. The role is read fresh each request. Sign-out is POST plus sameOrigin and deletes the server rows. proxy.ts is not an auth gate.
- Step-up: enforced server-side on every admin action (admin/motiv/actions.ts:17-22, admin/insights/actions.ts:8-13, admin/users/actions.ts:11, workbench/actions.ts:564-569).
- Magic links: hashed and consumed atomically (verify/confirm/route.ts:17-20). Scanner-safe GET then POST. The account comes from the token row. Enumeration-safe uniform responses.
- Abuse: the Postgres rate limiter is atomic and shared across instances. Email input is validated. Alert thresholds have a cooldown.

## 5. Dropped
- LINK-6 (switch-back restores a planted admin cookie): planting that cookie needs the same ability as planting the session cookie directly, so it adds nothing (session.ts:157, 85-88).
- SESS-5 (step-up only on view-as): every admin action calls step-up server-side (see section 4).
- SESS-8 (token generator unknown): lease.ts uses randomBytes(32) and createHash sha256.
- Merged as duplicates: LINK-3 into AUTH-2, OAUTH-3 into AUTH-1/AUTH-10, SESS-6 into AUTH-23, ABUSE-6 and OAUTH-7 into AUTH-21, ABUSE-7 and OAUTH-8 into AUTH-22.

## 6. Leads (unverified, from verifiers)
- workbench/actions.ts:531: an admin can approve their own report with no step-up.
- accounts.ts:90-102: claimEmail merges or moves identities from another account with no admin or other-method check.
- accounts.ts:32-33: email_verified is overwritten on every sign-in, so admin status can flip with what the provider reports.
- signin/page.tsx:25: an unknown `?error=` value is shown as text on the sign-in page.
- motiv/account/page.tsx:165-185: the claim form may render during view-as.

## 7. Not reviewed
- Provider console settings (redirect URIs, Microsoft tenant mode, Apple key rotation), Netlify edge behaviour for x-nf-client-connection-ip, Resend limits, emruz.com subdomains and DNS.
- Uncommitted changes on the branch; other API routes outside auth; runtime behaviour (nothing was run against any deployment).

Nothing here makes the auth secure. This is what was checked at commit 002dfb6.
