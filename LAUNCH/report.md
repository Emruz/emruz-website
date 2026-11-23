# Launch report

Run by /launch-kit on branch `launch-audit`, 2026-11-14. Base commit `4353b05`; code fixes committed on this branch. Not legal advice, not a compliance or security certification. "PASS" means the check was done and nothing was found, not that the law or the security bar is met.

Changelog: [`LAUNCH/changelog.md`](changelog.md)

## Release update (2026-11-21)

Run by /launch-kit on branch `launch-audit`: release update, fix mode. Kits run: compliance-drift-check, repo-kit. Others skipped (no full re-audit due).

| Kit | Result |
|---|---|
| compliance-drift-check | 8 changes: 5 pass, 1 fixed (GitHub in vendors.md), 2 open. LAUNCH/drift-2026-11-21.md |
| repo-kit | Full tier, Free plan. Rules: 4 pass, 1 fixed, 3 fail, 3 owner to confirm. CI: scan passed, CodeQL added. PR gate and hooks installed. LAUNCH/repo-report.md |

Top risks now:
1. Partners: privacy policy and ROPA don't cover partner staff, invites, or consent recorded on a customer's behalf (lawyer question 16).
2. Secret scanning and push protection are off on GitHub (free on this public repo).
3. GitHub (Motiv crash reports) isn't in the emruz.com privacy vendor table; DPA unconfirmed.
4. No backup or mirror of the repo.
5. CodeQL and the PR review record run but aren't required checks yet.

Owner to-dos: the commands in LAUNCH/repo-report.md, then run `scripts/install-hooks.sh`. Baseline tag not moved (drift items open).

## Status update (2026-11-15)

The launch audit's code fixes are on `main`, along with the Motiv changes that followed. Some items below were decided after this report was written:

- **Lifetime wording: decided.** It's a perpetual licence that doesn't expire, with at least 12 months' notice before support ends and a clause for the case where Emruz stops trading. Counsel should review it (lawyer question 6).
- **Lifetime revocation: decided.** Only for EULA misuse or admin error, and only while support runs. Refunds and chargebacks always end a licence.
- **Admin sign-in: decided.** Changes need a sign-in within the last 60 minutes, and an idle session ends after 2 hours.

Still open:
- **Legal entity:** the code names "Shahin Pirooz, doing business as Emruz". The fictitious business name has lapsed, so it needs refiling before sales. Whether to form an LLC is still open (lawyer question 4).
- **Refund rule:** the 14-day refund is in the terms and pricing page, but you haven't confirmed it (lawyer question 5).
- **Counsel review:** the terms, refund, and governing law still need review (lawyer questions 5 and 7).
- **Vendor agreements:** Netlify, Stripe, and Resend DPAs still need checking in each dashboard (`LAUNCH/vendors.md`).
- **Font licence:** EspecialKay sets the wordmark on every page, and no licence is in the repo (lawyer question 12).
- **Security items:** N3 (Origin check on cookie-authenticated API routes) and N4 (contact endpoint) are open. N2 and N5 need a check (`LAUNCH/security-findings.md`).
- **Production checks:** the admin lock, and migrations 015 and 016 on the live database.
- **Desktop app:** ship the update that honours the `perpetual` flag (the app prompt in `LAUNCH/lifetime-licence-fix.md`).

## Skill results

| Skill | Run or skipped | Result |
|---|---|---|
| compliance-drift-check | Skipped | First audit, no baseline |
| name-and-trademark-check | Run | Motiv: caution. Emruz: clear as far as the search reached. Registers not queried directly. |
| web-app-security (verify) | Run | E1 to E10: 10 fixed, 0 regressed. New: 0 Critical, 0 High, 3 Low, 1 Info. |
| legal-compliance-audit | Run | 20 checks: 7 PASS, 3 FIXED, 6 OPEN, 3 PARTIAL, 1 LAWYER |
| privacy-law-audit | Run | 22 checks: 5 PASS, 4 FIXED, 4 OPEN, 2 LAWYER, 3 PARTIAL, 4 N/A |
| app-prelaunch-check | Run | 30 checks: 19 PASS, 10 OPEN or PARTIAL, 1 N/A. No code changes needed. |
| ai-disclosure-audit | Skipped | AI answered "none" |
| oss-license-audit | Run | 129 production packages, all licences resolved. No GPL, AGPL, SSPL, or non-commercial licences. 5 PASS, 3 OPEN. |

## Top 5 risks (highest first)

1. **Motiv name may conflict.** UK journal entry 2025/046 (Class 9, AI meeting transcription) and US serial 79424201 (MOTIV, Class 9) need to be opened and checked before sales. If either is a live Motiv mark for this software, the name is at risk. (`LAUNCH/name-check.md`)
2. **Contract terms are unconfirmed.** The entity is a sole proprietor name set in code, not confirmed by the owner. The 14-day refund rule is not confirmed. The Lifetime wording differs between the pricing page and the terms. The terms are the buyer's contract, so these need an answer before sales. (`LAUNCH/profile.md`, `LAUNCH/compliance-checklist.md` #4, #20)
3. **GDPR representative and client-data role.** Motiv is sold to EU and UK customers with no EU or UK establishment, so an Art. 27 representative is likely required. For assessment clients, Emruz may be a processor for uploaded evidence, which may hold personal data. (`LAUNCH/privacy-law-checklist.md` #6, #8; `LAUNCH/ropa.md` activity 7)
4. **Vendor agreements are unverified.** No signed DPA or transfer mechanism for Netlify, Stripe, or Resend could be confirmed from the repo. (`LAUNCH/vendors.md`)
5. **Motiv desktop app is unreviewed.** It is the largest surface outside this repo: signing, notarisation, update signing, and desktop hardening are not verified. Within the site, the open security items are Low: N3 (no Origin check on cookie-authenticated API routes, defence in depth) and N4 (public contact endpoint, rate limited). (`LAUNCH/security-findings.md`, `LAUNCH/prelaunch-checklist.md` #25, #27, #28)

## Open security findings

Critical: 0. High: 0. Medium: 0.

| ID | Severity | Status | Summary |
|---|---|---|---|
| N2 | Low | Needs check | Evidence filename in `Content-Disposition` is not RFC 5987 encoded; a CR or LF in a filename would cause a 500, not header injection. Runtime test needed. |
| N3 | Low | Open | Cookie-authenticated API routes (evidence upload, avatar, `/api/me`) have no Origin check. SameSite=lax blocks cross-site POST today. |
| N4 | Low | Open | Public contact endpoint accepts POST from any origin. Rate limited to 5 per IP per hour. |
| N5 | Info | Needs check | Impersonation does not check the target account's admin status in `startImpersonation`. Confirm admins cannot impersonate other admins. |

All ten E-fixes (E1 to E10) were verified present in code. None regressed.

## Owner to-dos (dashboards, accounts, contracts, filings)

1. **Rotate the Resend API key** that was pasted in chat (`docs/open-items.md`, Housekeeping). Not verified as done.
2. Confirm the legal entity and whether an LLC is needed. Confirm the refund rule (14 days). Pick the Lifetime wording, then make the pricing page and terms match.
3. Check the Netlify, Stripe, and Resend dashboards for signed DPAs. Record the links in `LAUNCH/vendors.md`. Confirm each transfer mechanism.
4. Confirm the Netlify backup settings. Run one restore test to a branch database and record the date.
5. Set and record the Netlify log retention period (`LAUNCH/ropa.md` row 8).
6. Stripe: turn on automatic tax after the accountant confirms the registrations (`docs/open-items.md`).
7. Desktop app (Motiv repo): Apple Developer ID signing and notarisation, Windows code signing, update signing, and the desktop web-app-security pass.
8. Trademark: search USPTO, EUIPO, and UK IPO for MOTIV and EMRUZ. Decide whether to rename Motiv or file.
9. Rights: EspecialKay font licence (the wordmark on every page), and the Motiv icon author.
10. Decide on in-app account deletion and data export, or document the email procedure (`LAUNCH/prelaunch-checklist.md` #6, #18).
11. Breach runbook: fill in the contacts marked [[TODO]] in `LAUNCH/breach-runbook.md`.
12. Choose the project licence: a LICENSE file and a `license` field in `package.json` (both need your approval). Decide whether to keep the Next.js starter SVGs in `public/`.
13. Third-party notices: fill in the copyright lines in `LAUNCH/third-party-notices.md`, or approve installing a licence tool to generate them.
14. Send `LAUNCH/lawyer-questions.md` to counsel. Send the question list, not the site.
15. Read the drafted privacy and terms pages as a stranger, then send them to counsel.

## Lawyer questions

See [`LAUNCH/lawyer-questions.md`](lawyer-questions.md). 15 items, grouped by topic rather than strictly shortest first.

## Links

- Changelog: [`LAUNCH/changelog.md`](changelog.md)
- Profile and survey: [`LAUNCH/profile.md`](profile.md)
- Security: [`LAUNCH/security-findings.md`](security-findings.md)
- Legal and privacy: [`LAUNCH/compliance-checklist.md`](compliance-checklist.md), [`LAUNCH/privacy-law-checklist.md`](privacy-law-checklist.md), [`LAUNCH/ropa.md`](ropa.md), [`LAUNCH/vendors.md`](vendors.md), [`LAUNCH/breach-runbook.md`](breach-runbook.md)
- Pre-launch: [`LAUNCH/prelaunch-checklist.md`](prelaunch-checklist.md)
- Licences: [`LAUNCH/license-checklist.md`](license-checklist.md), [`LAUNCH/sbom.json`](sbom.json), [`LAUNCH/third-party-notices.md`](third-party-notices.md)
- Trademark: [`LAUNCH/name-check.md`](name-check.md)

## Not verified

- The Motiv desktop app (separate repo).
- Live site headers (CSP and HSTS on emruz.com).
- Vendor DPAs and transfer mechanisms.
- Contrast, keyboard, and focus (needs a browser run).
- Trademark registers (not queried directly).
- Penetration testing (not done; test only systems you own).

Launch-kit does not say the site is compliant or secure. This report lists what was checked and what is still open.
