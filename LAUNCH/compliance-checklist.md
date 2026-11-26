# Legal compliance checklist (20 checks)

Run 2026-11-14 on branch `launch-audit`. Status: PASS, FIXED (committed this run), OPEN (owner decides or supplies facts), LAWYER (needs counsel), N/A. This is not legal advice and not a compliance certification. "PASS" means the check was done and nothing was found in the code, not that the law is satisfied.

Fixes this run: `972d859` (Group A), `9a7313e` (Group B), `3cfec93` (Group D).

| # | Group | Check | Status | Evidence | Notes |
|---|---|---|---|---|---|
| 1 | A | Privacy policy exists, dated, matches data, names a contact | PASS | `src/app/privacy/page.tsx` (dated 10 Nov 2026, contact info@emruz.com); `src/app/motiv/privacy/page.tsx` | Entity name comes from code (see #4). Data inventory matches the scan (see #6). |
| 2 | A | Terms (web) and EULA (desktop) with refund, governing law, liability, acceptable use | LAWYER | `src/app/terms/page.tsx`, `src/app/motiv/eula/page.tsx` | Both pages exist and cover these topics. The refund rule (14 days, full refund) is not confirmed by the owner (profile says TODO). Governing law is California. See lawyer questions 4, 5, 7. |
| 3 | A | Cookie and storage notice | FIXED | `src/app/privacy/page.tsx` cookie table | Cookies are `emruz_session` (30 days), `emruz_oauth_…` (10 min), `emruz_admin_session`. FIXED `9a7313e` corrected the admin cookie lifetime to "up to 30 days, or until they switch back". No analytics cookies; only essential cookies, so no banner is needed under EU/UK rules. Form drafts were saved in localStorage (`src/components/SessionGuard.tsx`) without disclosure. FIXED in the privacy policy cookies section (commit pending in this run): drafts stay on the device and are cleared on submit (`SessionGuard.tsx:143`). |
| 4 | A | Who you are: legal entity, address, contact | OPEN | `src/components/LegalPage.tsx:4` sets `LEGAL_PARTY = 'Shahin Pirooz, doing business as Emruz'` and the address "Santa Clara, California, USA" | The code names a sole proprietor, but profile.md says [[TODO]]. Owner must confirm the entity name, that the address is real, and whether an LLC exists. No Impressum needed (no DE or AT market). |
| 5 | A | Linked everywhere: footer, app Legal menu, sign-up and checkout | FIXED | `src/components/Footer.tsx` (Privacy, Terms, Motiv EULA on every page via `src/app/layout.tsx:70`); `972d859` adds terms and privacy links to sign-in; `src/app/motiv/page.tsx:147` links terms and EULA at checkout | Motiv desktop app About or Legal menu was not checked: it is a separate repo. |
| 6 | B | Inventory of forms, tags, SDKs, requests | PASS | Scan in `LAUNCH/profile.md` (Scan notes) | No analytics, pixels, or third-party scripts found. No `next/font/google`, no external CDN, no `<script>`. Forms: contact, newsletter, register, account, intake, Motiv activation. |
| 7 | B | Consent before tracking; reject as easy as accept | PASS | No trackers found (#6) | The desktop app's daily check-in is disclosed in the Motiv privacy text and is needed for licensing. Telemetry and auto-update pings in the desktop app are not in this repo; see lawyer question 9. |
| 8 | B | Form consent lines; unchecked marketing boxes; double opt-in | PASS | `src/app/assessments/self/RegisterForm.tsx:39` (required consent checkbox with text and privacy link); `src/lib/server/newsletter.ts` (confirm email before subscribing) | Contact form has no marketing box. Newsletter double opt-in is confirmed in code. |
| 9 | B | Minimal fields | PASS | `src/app/contact/client.tsx`, `src/app/api/contact/route.ts` | Contact: name, email, company (optional), topic, message. Nothing beyond what the stated purpose needs was seen. |
| 10 | B | Deletion and export route | PARTIAL / OPEN | `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` give email deletion and export requests | No in-app account deletion found (`grep` for "delete account" returned nothing). Apple's in-app deletion rule applies only to App Store apps, and Motiv is not in the App Store, so no rule is broken. Owner may want in-app deletion (a feature, so owner decides). |
| 11 | B | Processors named in policy | PASS | `src/app/privacy/page.tsx` "Who helps us run emruz.com" table | Netlify, Stripe, Resend, Microsoft, Google, Apple, plus WhiteDog Cyber for managed products. US transfers noted. |
| 12 | C | Contrast (4.5:1 text, 3:1 large and UI) | OPEN | Not measured | Needs a browser run (axe or Lighthouse). Not done in this static pass. |
| 13 | C | Alt text; labels on icon buttons | PARTIAL | `grep` of `<img>` tags in `src/app` and `src/components`: all have `alt` (decorative ones use `alt=""`). Icon-button heuristic found no unlabeled buttons. | Static check only. Verify in browser. |
| 14 | C | Keyboard: tab order, visible focus, no traps | OPEN | Not tested | Needs a browser run. |
| 15 | C | Forms and links: labels, errors, link text | PARTIAL | No "click here" or "read more" link text found. Error messages present in forms (for example, `src/app/workbench/e/[id]/evidence/page.tsx:26`) | Static check only. |
| 16 | C | Structure: lang, one H1, zoom, reduced motion | PARTIAL | `src/app/layout.tsx:63` sets `lang="en"` | H1 count, zoom at 200%, and reduced-motion were not checked. Needs browser run. |
| 17 | D | Numbers, testimonials, logos trace to source | PASS | `grep` for testimonials, case studies, awards, and client counts found none | The home page framework strip (NIST CSF, ISO 27001, CMMC) is framed as "Framework-Grounded". It is not a certification claim. |
| 18 | D | Loaded words | FIXED | `3cfec93`: "ensure compliance" changed to "support compliance with" (`src/app/services/cloud/page.tsx:50`) | Remaining: "secure and cost-effective from day one" (`src/app/page.tsx:50`) is general marketing wording; lawyer question 11 if the owner wants it checked. "HIPAA", "GDPR", "PCI-DSS" appear only as frameworks the firm works with, not as claims about emruz.com. |
| 19 | D | Licences: fonts, photos, icons, embeds, open source | OPEN | `globals.css:4-28` loads the custom font `font/EspecialKay_Emruz.ttf` | The font's licence is not in the repo. Owner must confirm rights. Deep pass: oss-license-audit. |
| 20 | D | Pricing truth: same everywhere | FIXED / OPEN | `3cfec93`: renewal wording on the monthly and annual plan notes (`src/app/motiv/page.tsx:16-17`). OPEN: lifetime wording (`src/app/motiv/page.tsx:18` says "for as long as you use Motiv"; `src/app/terms/page.tsx` says "for as long as Emruz offers Motiv"). Refund: 14 days in `src/app/motiv/page.tsx:149` and `src/app/terms/page.tsx`, but the owner has not confirmed it. | Owner must choose the lifetime wording and confirm the refund rule. Prices match in code ($9, $99, $299). |

## Step 5: local rules (list only, not concluded)

Deep passes: privacy-law-audit (GDPR, UK GDPR, CCPA/CPRA), oss-license-audit.

- **GDPR and ePrivacy** (EU market): privacy text covers basis and transfers. No tracking, so no consent banner needed for cookies.
- **UK GDPR**: same as above.
- **CCPA/CPRA** (California): policy says no sale or sharing; no opt-out link needed if that stays true.
- **Other US state privacy laws**: not checked; depends on the states served.
- **CAN-SPAM**: newsletter has double opt-in and unsubscribe. Contact emails identify the sender.
- **FTC endorsement guides**: no testimonials found.
- **California auto-renewal law** (Bus. & Prof. Code 17600 et seq.): renewal is now stated at purchase (`3cfec93`). Online cancellation is available on the account page. Checkout flow (Stripe-hosted) not checked.
- **ADA and WCAG 2.2 AA**: Group C open items (#12 to #16).
- **European Accessibility Act**: applies to digital services sold to EU consumers. Motiv sales to EU consumers would be in scope. Lawyer question.
- **App store review rules**: not applicable (Motiv not in an app store).
