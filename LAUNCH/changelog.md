# Launch audit changelog

Branch `launch-audit`, base `4353b05`. Newest first. Only files changed by this run are listed.

## Since the audit: merged to main (2026-11-15)

| PR | Change | Notes |
|---|---|---|
| #22 | Motiv: Lifetime is a perpetual licence (never-expiring lease, `perpetual` flag). Revocation by reason (refund, chargeback, EULA misuse, admin error); refunds and chargebacks always end a licence; misuse and admin error only while support runs. Support dates stored in the database (migration 015). Admin split into customers, licences, support, grant and archive pages. Archive and delete for complimentary licences. Admin pages lock until a recent sign-in (60 min; idle session 2 h). Terms, pricing and account wording, and the launch-audit legal and privacy fixes. | Migrations 015 and 016 applied on deploy. Server change is safe before the desktop app update. |
| #24 | `ship.sh` no longer rewrites the lockfile after a merge; `npm ci` runs only when dependencies changed. | |
| #25 | `npm run stripe:preview -- <PR>` forwards Stripe test events to a preview; `npm run preview -- "Title" --stripe` does the same. | Local only. Needs the Stripe CLI. |
| #26 | PSA renamed to PSAT (Phishing Simulations & Awareness Training) in the nav, footer and product name. Internal codes, the `/products/psa` URL and SKU `WD-PSA-CP-02` are unchanged. | |
| #27 | Products menu reduced to two entries: Motiv and Managed Security. | |

Preview testing for #22 covered: a monthly misuse revoke with billing cancelled and the buyer emailed; a refund on a monthly subscription; a Lifetime refund (revoked, no Reinstate offered); the support end date blocking a Lifetime misuse revoke; archive, restore and delete; pricing, terms, account and button layout. The admin lock on production is still to be checked.

Cleanup: the local branches `chore/replace-arctic` and `launch-audit` were deleted once their commits were confirmed in PR #22.

## Drift check (2026-11-15)

Release update since the launch baseline. Full report: `LAUNCH/drift-2026-11-15.md`. Found: a new permissive dependency tree behind `/database` (27 packages), a stale `arctic` lock entry, Lifetime and refund wording changes, AI-tool metadata in the logo files, and a possible Neon sub-processor. No new trackers, scripts, cookies or AI calls. A full re-audit is not needed.

## Commits

| Commit | Group | Files | Why |
|---|---|---|---|
| c62c68e | privacy-law | `src/app/portal/e/[id]/page.tsx` | Client portal evidence uploads and links collect personal data. Two one-line notices with a link to /privacy added. |
| a33ccc5 | privacy-law | `src/app/privacy/page.tsx` | Rights response times stated: one month (GDPR), 45 days for California (CCPA), replacing "within the time the law requires". |
| 4192358 | privacy-law | `src/app/contact/client.tsx`, `src/app/insights/page.tsx` | Contact and newsletter forms collect personal data with no link to the privacy policy at that point. Each now links and says what the details are used for. |
| bc43dd7 | B | `src/app/privacy/page.tsx` | Form drafts are saved in the browser's localStorage (`SessionGuard.tsx`). The privacy policy did not say so. Added a paragraph saying drafts stay on the device and are cleared on submit. |
| 9a7313e | B | `src/app/privacy/page.tsx` | The admin session cookie is set for 30 days, but the policy said "until they switch back". Corrected to "up to 30 days, or until they switch back". |
| 3cfec93 | D | `src/app/motiv/page.tsx`, `src/app/services/cloud/page.tsx` | Monthly and annual plan notes now say they renew until cancelled, as the California auto-renewal law requires at purchase. The cloud FAQ says "support compliance with" instead of "ensure compliance". |
| 972d859 | A | `src/app/signin/page.tsx` | Signing in creates an account, so the page now links to the terms and privacy policy. |

## Working-tree files created (not yet committed at time of writing)

| File | Why |
|---|---|
| `LAUNCH/profile.md` | Survey answers and repo scan (from the intake). |
| `LAUNCH/name-check.md` | Name and trademark screen. |
| `LAUNCH/lawyer-questions.md` | Deduplicated questions for counsel. |
| `LAUNCH/security-findings.md` | Verification of the E1 to E10 security fixes, plus post-E10 review. |
| `LAUNCH/compliance-checklist.md` | 20-check legal checklist. |
| `LAUNCH/changelog.md` | This file. |
| `LAUNCH/privacy-law-checklist.md` | 22-row GDPR, UK GDPR, and CCPA checklist. |
| `LAUNCH/ropa.md` | Record of processing (9 activities, GDPR Art. 30 draft). |
| `LAUNCH/vendors.md` | Vendor list with role, DPA status, and transfer method. |
| `LAUNCH/breach-runbook.md` | Personal data breach runbook (GDPR 72 hours, California notice). |
| `LAUNCH/license-checklist.md`, `LAUNCH/sbom.json`, `LAUNCH/third-party-notices.md` | Licence audit: 8 checks and flagged components; `sbom.json` (CycloneDX 1.5, 129 production components from the lockfile, all licences resolved), `LAUNCH/third-party-notices.md` (draft; copyright lines are [[TODO]]). Read-only: no packages installed or changed. |
| `LAUNCH/prelaunch-checklist.md` | 30-row app pre-launch checklist. No code changes from this step; all open items need a dashboard, a feature decision, or the desktop repo. |

## Not changed

- Entity details: the code already names "Shahin Pirooz, doing business as Emruz" (`src/components/LegalPage.tsx:4`). This was not changed, because the owner must confirm it.
- Refund rule (14 days): not changed. It appears in two places, and the owner must confirm it.
- Lifetime plan wording: not changed. The pricing page and the terms disagree; the owner must pick one.
- No dependency changes. No deletions.
