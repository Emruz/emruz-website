# Launch audit changelog

Branch `launch-audit`, base `4353b05`. Newest first. Only files changed by this run are listed.

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
