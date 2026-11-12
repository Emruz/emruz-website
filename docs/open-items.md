# emruz.com and Motiv: open items

Tick items off as they are done. Grouped by when they're needed.

## Before selling Motiv (go-live)

- [ ] **Stripe live keys.** Replace the sandbox values in Netlify with live ones: `STRIPE_SECRET_KEY` (sk_live_…).
- [ ] **Stripe live prices.** Use the live price IDs of the three copied products for `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_LIFETIME`.
- [ ] **Stripe live webhook.** Create the same destination in live mode (same URL and 7 events, snapshot payload) and set its `STRIPE_WEBHOOK_SECRET`.
- [ ] **Turn sales tax back on:** `npx netlify env:unset STRIPE_AUTOMATIC_TAX` (it is `false` only for sandbox testing).
- [ ] **Customer portal** configured in live mode (payment methods, invoice history, cancel).
- [ ] **Tax registrations** confirmed with your accountant (California and any other states or countries where you must collect).
- [ ] **Legal review** of /privacy, /terms, /motiv/privacy and /motiv/eula (drafted and live), then update PRIVACY_POLICY.md and EULA.md in the Motiv repo to match.
- [ ] **Stripe public details:** add https://emruz.com/terms and https://emruz.com/privacy under Settings > Public details (live and sandbox).
- [ ] **Open sales:** `npx netlify env:set MOTIV_SALES_OPEN true`, then redeploy.
- [ ] **Downloads.** Signed and notarized Mac build, Windows build, and download links on the account page.
- [ ] **Test purchase** in live mode with a real card, then refund it.

## Sign-in providers

- [x] Microsoft (redirect fix: always return to the public site address)
- [x] Google (OAuth client)
- [ ] Apple (Services ID and key; needs the paid Apple Developer account)

## Site content

- [ ] Confirm which capabilities sit in each EDR / MDR / XDR / ΔDR tier (`src/content/packages.ts`).
- [ ] Fill out the thin Data Science, AI and Security Ops pages.
- [ ] Confirm info@emruz.com receives contact form email (or set CONTACT_TO). Messages are also saved at /admin/messages.
- [ ] Newsletter: sending to subscribers is not built yet. Export the CSV from /admin/insights or ask for a "send to subscribers" button.

## Housekeeping

- [ ] Rotate the Resend API key that was pasted in chat, and update `RESEND_API_KEY`.
- [ ] Pick a LinkedIn banner from the four options.

## Done

- [x] Netlify Database, migrations applied
- [x] Lease signing key (kid k1) loaded and matching the app
- [x] Email sign-in links via Resend
- [x] Motiv activation tested end to end
- [x] Stripe sandbox products, prices and webhook
