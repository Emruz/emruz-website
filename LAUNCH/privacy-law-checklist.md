# Privacy law checklist (GDPR, UK GDPR, CCPA/CPRA)

Run 2026-11-14 on branch `launch-audit`. Status: PASS, FIXED (committed this run), OPEN (owner acts), LAWYER (counsel decides), N/A (reason given). First pass, not legal advice. Checks already PASS in `LAUNCH/compliance-checklist.md` (policy, consent, deletion route, minimisation, third parties) are not repeated except where this audit changed something.

## Step 1: Does each law apply?

- **GDPR and UK GDPR: applies.** Motiv is sold to EU and UK customers (markets in `LAUNCH/profile.md`), and the policy says so. The company is not established in the EU or UK, so Art. 3(2) applies because goods or services are offered to people there.
- **CCPA/CPRA: applies if a threshold is met. Undetermined.** Annual revenue, the number of California consumers, and the share of revenue from data sales are not in the repo. The company is in Santa Clara, California. Owner and counsel to confirm (lawyer question 14). The checks below are done anyway, because they are cheap and the site serves California users.
- **Other US state laws** (Virginia, Colorado, Connecticut, Texas, and others): not checked; depend on where customers live. Lawyer question 14.

## Step 2: GDPR and UK GDPR checks

| # | Check | Status | Evidence | Notes |
|---|---|---|---|---|
| 1 | Legal basis for each use | OPEN | `LAUNCH/ropa.md` (proposed basis per activity); policy "Visitors from the EU, UK" paragraph | The policy names the bases in general terms, not per purpose. Owner and counsel must confirm the proposed bases in `ropa.md`. |
| 2 | Valid consent (unticked, withdrawable, logged) | PASS | `src/app/assessments/self/RegisterForm.tsx:39` (required checkbox, not pre-ticked); `src/app/assessments/self/actions.ts:46-51` (consent text, version, IP, time stored); withdrawal in self-assessment history; newsletter double opt-in and unsubscribe | Withdrawal is as easy as giving consent for both the assessment and the newsletter. |
| 3 | Record of processing (`ropa.md`) | FIXED | `LAUNCH/ropa.md` created (9 activities) | Uncommitted, goes in the LAUNCH commit. |
| 4 | Signed DPAs with each vendor | OPEN | `LAUNCH/vendors.md` | Netlify, Stripe, Resend: DPA status not verifiable from the repo. Owner must check each vendor's dashboard and record the link. |
| 5 | Transfers outside the EU and UK covered | OPEN | `LAUNCH/vendors.md` (transfer column) | The policy says providers may process in the US but does not name the mechanism (DPF, SCCs, UK addendum). Owner to confirm per vendor; counsel to confirm. |
| 6 | EU and UK representative (Art. 27) | LAWYER | `LAUNCH/lawyer-questions.md` item 14 | Likely needed: no EU or UK establishment, and Motiv is sold to EU and UK customers on a regular basis. Counsel to decide. |
| 7 | DPO decision | N/A (decision recorded) | Reasoning in this row | A DPO is required for large-scale regular monitoring of individuals or large-scale special-category processing as a core activity. Emruz does neither; the Motiv app is local and the site does not monitor visitors. Owner to confirm. |
| 8 | DPIA for high-risk processing | LAWYER | `LAUNCH/ropa.md` activity 7 | Evidence uploads can hold personal data of client staff. Counsel to decide whether a DPIA is needed (lawyer question 15). No profiling or AI-based decisions were found. |
| 9 | Individual rights with routes and one-month response | FIXED | `a33ccc5`: policy now says "within one month (45 days for California residents), or sooner where the law requires" (`src/app/privacy/page.tsx`) | Routes: email (`info@emruz.com`) from the account address; self-assessment deletion and withdrawal in-app. Human review of automated decisions: none, since self-assessment scores are rule-based and shown to the user (lawyer question 15). |
| 10 | Breach process | FIXED | `LAUNCH/breach-runbook.md` created | Owner fills in the contacts marked [[TODO]]. Uses the security alerts already sent by `src/lib/server/alerts.ts`. |
| 11 | Children (age gating, parental consent) | PASS | `src/app/privacy/page.tsx` "Children" section; no age gate in the sign-up code | The policy says the service is for business use and not directed to under-16s. No age gate is needed for a business product. Counsel may want to confirm. |
| 12 | Privacy policy content (controller, contact, purposes, recipients, transfers, retention, rights, complaint, whether required) | PARTIAL | `src/app/privacy/page.tsx` | Present: controller, contact, purposes, recipients, retention, rights, complaint to a regulator. Missing: an explicit statement that some fields are optional. Owner to decide the wording; not changed here. Transfer mechanism: see #5. |

## Step 3: CCPA and CPRA checks

| # | Check | Status | Evidence | Notes |
|---|---|---|---|---|
| 13 | Notice at or before collection | FIXED | `4192358` (contact form and newsletter link to /privacy); `972d859` (sign-in terms and privacy); `c62c68e` (portal evidence upload); existing self-assessment privacy link (`RegisterForm.tsx:41`); Motiv checkout links terms and EULA (`src/app/motiv/page.tsx:147`) | Motiv desktop first-run notice: not checked (separate repo). Owner to check. |
| 14 | "Do Not Sell or Share" link | N/A | No sale or sharing found: no advertising, analytics, or tracking vendors (`LAUNCH/vendors.md`); no pixels in the code scan | Required only if the site sells or shares data for cross-context advertising. If that changes, this link becomes required. |
| 15 | Global Privacy Control (GPC) honoured | N/A | As #14 | Not required while nothing is sold or shared. Revisit if #14 changes. |
| 16 | "Limit the Use of My Sensitive Personal Information" link | N/A | No precise location, government ID, or health data collected. No passwords: sign-in is by provider or email link (`src/app/auth/email/route.ts`) | Account log-in combined with a password is sensitive personal information under CPRA; no passwords are collected, so the trigger does not apply. |
| 17 | Policy disclosures (categories, sources, purposes, recipients, sold or shared statement, retention, rights, update date) | PASS | `src/app/privacy/page.tsx` (updated 10 Nov 2026); sold or shared statement "we don't sell or share personal information" in the California section | The policy updated date is within 12 months. |
| 18 | At least two request methods; acknowledgement and response times | PARTIAL | Email only (`info@emruz.com`), now with the one-month and 45-day response times (`a33ccc5`) | Email is acceptable for an online business with no store. Acknowledgement within 10 business days is not stated; owner to decide whether to add it. |
| 19 | Identity verification and authorised agents | PARTIAL | Policy: request "from the address on your account" (`src/app/privacy/page.tsx`) | That works as verification for account holders. Authorised agents are not addressed. Lawyer question 15 covers the wider question; agents are an owner decision. |
| 20 | Right to know, correct, delete, opt out | PASS | `src/app/privacy/page.tsx` "Your choices and rights" | Access, correction, deletion, and stop-use are listed. Opt-out of sale or sharing: N/A (#14). |
| 21 | Service-provider contract terms (no selling, purpose limits, audit) | OPEN | `LAUNCH/vendors.md` | Same as #4. The CPRA contract clauses must be in each vendor's DPA. |
| 22 | No penalties or dark patterns for exercising rights | PASS | `src/app/privacy/page.tsx`: "we won't treat you differently for exercising these rights" | No financial incentive programmes were found in the code. |

## Summary

- **Fixed this run:** #3 (ROPA), #9 (response times), #10 (breach runbook), #13 (notices at collection).
- **Owner must act:** #4 and #21 (vendor DPAs, one row each for the vendor list), #5 (transfer mechanisms), #12 (optional-fields wording), #1 (confirm bases), #13 (Motiv desktop first-run notice), #18 (acknowledgement timing), #19 (agents).
- **Counsel decides:** #6 (representative), #8 (DPIA), #14 (CCPA applicability and other state laws), and #15 (processor status).
- **Not applicable:** #7 (DPO, with reasoning), #14 and #15 (no sale or sharing), #16 (no sensitive personal information collected).
