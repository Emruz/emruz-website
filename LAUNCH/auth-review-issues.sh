#!/usr/bin/env sh
# gh issue commands for the auth code review of Emruz/emruz-website at commit 002dfb6.
# Nothing has been created. Review, then run: sh LAUNCH/auth-review-issues.sh
# Bodies leave out attack steps; full detail is in LAUNCH/auth-review.md (keep that file out of public places).
set -e
REPO=Emruz/emruz-website
gh label create security --repo "$REPO" --color B60205 --force

# If this repo is public, file AUTH-1 as a private security advisory instead (Security tab > Advisories > New draft).
gh issue create --repo "$REPO" --label security --label bug --title "[auth][High] View-as can add sign-in methods to the target (AUTH-1)" --body-file - <<'EOF'
**AUTH-1, High.** View-as can add sign-in methods to the target.

**Location (commit 002dfb6):** email/route.ts:22-30; verify/confirm/route.ts:27-29; accounts.ts:99-102; [provider]/route.ts:17; callback/[provider]/route.ts:59-60

**Fix:** Refuse claim, add-email and link flows when impersonatedBy is set.

**Crosswalk:** OWASP A01 | ASVS 5.0 V8 | API API5 | CWE-863

**Done when**
- The fix is in place and the attack path for AUTH-1 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-1.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] Open redirect via control characters in next (AUTH-2)" --body-file - <<'EOF'
**AUTH-2, Medium.** Open redirect via control characters in `next`.

**Location (commit 002dfb6):** session.ts:189-191; callback/[provider]/route.ts:66; verify/confirm/route.ts:52; signin/page.tsx:22-24

**Fix:** Reject control chars and backslash, parse, compare origin.

**Crosswalk:** OWASP A01 | ASVS 5.0 V3, V10 | API n/a | CWE-601

**Done when**
- The fix is in place and the attack path for AUTH-2 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-2.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] Silent auto-link by verified email, admins included (AUTH-3)" --body-file - <<'EOF'
**AUTH-3, Medium.** Silent auto-link by verified email, admins included.

**Location (commit 002dfb6):** accounts.ts:38-42, 53-59, 66-71; session.ts:177-186

**Fix:** No auto-link; require sign-in with an existing method, then link.

**Crosswalk:** OWASP A07 | ASVS 5.0 V10, V6 | API API2 | CWE-287

**Done when**
- The fix is in place and the attack path for AUTH-3 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-3.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] Magic link not bound to requesting browser (AUTH-4)" --body-file - <<'EOF'
**AUTH-4, Medium.** Magic link not bound to requesting browser.

**Location (commit 002dfb6):** verify/page.tsx:7-23; verify/confirm/route.ts:49-52; accounts.ts:92-97

**Fix:** Browser-binding cookie; show the email when it is missing.

**Crosswalk:** OWASP A07 | ASVS 5.0 V6, V7 | API n/a | CWE-352

**Done when**
- The fix is in place and the attack path for AUTH-4 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-4.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] View-as outlives the admin's session and rights (AUTH-5)" --body-file - <<'EOF'
**AUTH-5, Medium.** View-as outlives the admin's session and rights.

**Location (commit 002dfb6):** session.ts:86, 103-110, 145, 178

**Fix:** Tie the impersonation row to the admin session; re-check admin on each request.

**Crosswalk:** OWASP A07 | ASVS 5.0 V7, V8 | API n/a | CWE-613

**Done when**
- The fix is in place and the attack path for AUTH-5 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-5.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] Email add needs no recent sign-in (AUTH-6)" --body-file - <<'EOF'
**AUTH-6, Medium.** Email add needs no recent sign-in.

**Location (commit 002dfb6):** account/actions.ts:20-26, 70-92; verify/confirm/route.ts:35-39

**Fix:** requireRecentSignIn on add, default and remove; notify old address.

**Crosswalk:** OWASP A07 | ASVS 5.0 V6, V7 | API API2 | CWE-306

**Done when**
- The fix is in place and the attack path for AUTH-6 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-6.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] No way to revoke other sessions (AUTH-7)" --body-file - <<'EOF'
**AUTH-7, Medium.** No way to revoke other sessions.

**Location (commit 002dfb6):** session.ts:162-169; account/actions.ts:95-125

**Fix:** Sign out everywhere; revoke others on email or identity change.

**Crosswalk:** OWASP A07 | ASVS 5.0 V7 | API API2 | CWE-613

**Done when**
- The fix is in place and the attack path for AUTH-7 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-7.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] Targeted lockout of email sign-in (AUTH-8)" --body-file - <<'EOF'
**AUTH-8, Medium.** Targeted lockout of email sign-in.

**Location (commit 002dfb6):** email/route.ts:25-26, 43-44; db.ts:36-43

**Fix:** Check IP limit first; count only sends; prefer a short delay to a block.

**Crosswalk:** OWASP A06 | ASVS 5.0 V2, V6 | API API4 | CWE-799

**Done when**
- The fix is in place and the attack path for AUTH-8 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-8.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Medium] No global or daily email send cap (AUTH-9)" --body-file - <<'EOF'
**AUTH-9, Medium.** No global or daily email send cap.

**Location (commit 002dfb6):** email/route.ts:25-37; db.ts:35-43; email.ts:14-26

**Fix:** Global hourly and daily caps that fail closed and alert; daily per-recipient cap.

**Crosswalk:** OWASP A06 | ASVS 5.0 V2 | API API4 | CWE-770

**Done when**
- The fix is in place and the attack path for AUTH-9 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-9.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Linking while impersonating can escalate the target (AUTH-10)" --body-file - <<'EOF'
**AUTH-10, Low.** Linking while impersonating can escalate the target.

**Location (commit 002dfb6):** see AUTH-1 (OAuth path), accounts.ts:66-68

**Fix:** Fixed by AUTH-1.

**Crosswalk:** OWASP A01 | ASVS 5.0 V8, V10 | API n/a | CWE-863

**Done when**
- The fix is in place and the attack path for AUTH-10 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-10.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Unverified Microsoft email blocks addEmail (AUTH-11)" --body-file - <<'EOF'
**AUTH-11, Low.** Unverified Microsoft email blocks addEmail.

**Location (commit 002dfb6):** oauth.ts:164-169; accounts.ts:32, 66-68, 129-134

**Fix:** Store email only when verified, or filter on email_verified.

**Crosswalk:** OWASP A07 | ASVS 5.0 V10 | API n/a | CWE-287

**Done when**
- The fix is in place and the attack path for AUTH-11 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-11.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Re-sign-in during view-as leaves admin cookie usable (AUTH-12)" --body-file - <<'EOF'
**AUTH-12, Low.** Re-sign-in during view-as leaves admin cookie usable.

**Location (commit 002dfb6):** session.ts:53-60, 151-160

**Fix:** Delete the old row and admin cookie in createSession; check ownership on switch-back.

**Crosswalk:** OWASP A07 | ASVS 5.0 V7 | API n/a | CWE-384

**Done when**
- The fix is in place and the attack path for AUTH-12 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-12.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] No __Host- prefix on session cookies (needs check) (AUTH-13)" --body-file - <<'EOF'
**AUTH-13, Low.** No `__Host-` prefix on session cookies (needs check).

**Location (commit 002dfb6):** session.ts:8, 10, 37-43

**Fix:** Rename to `__Host-` cookies.

**Crosswalk:** OWASP A07 | ASVS 5.0 V3, V7 | API n/a | CWE-1275

**Done when**
- The fix is in place and the attack path for AUTH-13 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-13.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Admin drafts stay in localStorage after sign-out (AUTH-14)" --body-file - <<'EOF'
**AUTH-14, Low.** Admin drafts stay in localStorage after sign-out.

**Location (commit 002dfb6):** SessionGuard.tsx:17, 53-64

**Fix:** sessionStorage or clear on sign-out.

**Crosswalk:** OWASP A04 | ASVS 5.0 V14 | API n/a | CWE-922

**Done when**
- The fix is in place and the attack path for AUTH-14 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-14.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] View-as has no target role check (AUTH-15)" --body-file - <<'EOF'
**AUTH-15, Low.** View-as has no target role check.

**Location (commit 002dfb6):** admin/users/actions.ts:12-14; session.ts:141-148

**Fix:** Refuse admin and staff targets.

**Crosswalk:** OWASP A01 | ASVS 5.0 V8 | API API5 | CWE-269

**Done when**
- The fix is in place and the attack path for AUTH-15 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-15.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Actions during view-as logged without the admin (AUTH-16)" --body-file - <<'EOF'
**AUTH-16, Low.** Actions during view-as logged without the admin.

**Location (commit 002dfb6):** accounts.ts:69, 104; switch-back/route.ts:9-13

**Fix:** Log the actor whenever impersonatedBy is set.

**Crosswalk:** OWASP A09 | ASVS 5.0 V16 | API n/a | CWE-778

**Done when**
- The fix is in place and the attack path for AUTH-16 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-16.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Magic links live 20 min; siblings stay valid (AUTH-17)" --body-file - <<'EOF'
**AUTH-17, Low.** Magic links live 20 min; siblings stay valid.

**Location (commit 002dfb6):** email/route.ts:28-30; account/actions.ts:78-80; verify/confirm/route.ts:17-20

**Fix:** 15 min; invalidate siblings on issue and use.

**Crosswalk:** OWASP A07 | ASVS 5.0 V6 | API n/a | CWE-613

**Done when**
- The fix is in place and the attack path for AUTH-17 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-17.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Rate-limit key not normalised (AUTH-18)" --body-file - <<'EOF'
**AUTH-18, Low.** Rate-limit key not normalised.

**Location (commit 002dfb6):** email/route.ts:14, 25

**Fix:** Canonical key (strip +tag, Gmail dots).

**Crosswalk:** OWASP A06 | ASVS 5.0 V2 | API API4 | CWE-799

**Done when**
- The fix is in place and the attack path for AUTH-18 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-18.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Client IP falls back to X-Forwarded-For (needs check) (AUTH-19)" --body-file - <<'EOF'
**AUTH-19, Low.** Client IP falls back to X-Forwarded-For (needs check).

**Location (commit 002dfb6):** api.ts:11-13

**Fix:** Trust only x-nf-client-connection-ip in production.

**Crosswalk:** OWASP A06 | ASVS 5.0 V2 | API API4 | CWE-348

**Done when**
- The fix is in place and the attack path for AUTH-19 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-19.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Unlimited failure-path writes, no cleanup (AUTH-20)" --body-file - <<'EOF'
**AUTH-20, Low.** Unlimited failure-path writes, no cleanup.

**Location (commit 002dfb6):** verify/confirm/route.ts:17-23; callback/[provider]/route.ts:37-52; db.ts:36-43; purge-deleted.mts:16-22

**Fix:** Per-IP limits on confirm and callback; scheduled purge.

**Crosswalk:** OWASP A10 | ASVS 5.0 V2 | API API4 | CWE-770

**Done when**
- The fix is in place and the attack path for AUTH-20 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-20.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Unescaped provider error text in logs (AUTH-21)" --body-file - <<'EOF'
**AUTH-21, Low.** Unescaped provider error text in logs.

**Location (commit 002dfb6):** callback/[provider]/route.ts:39, 43-44, 68

**Fix:** Strip CR/LF and cap length; log error code only.

**Crosswalk:** OWASP A09 | ASVS 5.0 V16 | API n/a | CWE-117

**Done when**
- The fix is in place and the attack path for AUTH-21 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-21.
EOF

gh issue create --repo "$REPO" --label security --label bug --title "[auth][Low] Unbounded OAuth state cookies (AUTH-22)" --body-file - <<'EOF'
**AUTH-22, Low.** Unbounded OAuth state cookies.

**Location (commit 002dfb6):** [provider]/route.ts:19-31

**Fix:** Cap pending cookies, or store attempts server-side.

**Crosswalk:** OWASP A06 | ASVS 5.0 V2 | API API4 | CWE-770

**Done when**
- The fix is in place and the attack path for AUTH-22 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-22.
EOF

gh issue create --repo "$REPO" --label security --label enhancement --title "[auth][Info] Batch of hardening notes (AUTH-23)" --body-file - <<'EOF'
**AUTH-23, Info.** Batch of hardening notes.

**Location (commit 002dfb6):** see section 3.2

**Fix:** see 3.2.

**Crosswalk:** OWASP various | ASVS 5.0 various | API n/a | CWE various

**Done when**
- The fix is in place and the attack path for AUTH-23 in LAUNCH/auth-review.md no longer works.
- A test covers the case.

Details, attack steps and verifier notes: LAUNCH/auth-review.md, AUTH-23.
EOF
