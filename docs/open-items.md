# emruz.com and Motiv: open items

Tick items off as they are done. Grouped by when they're needed.

## Before selling Motiv (go-live)

- [ ] **Stripe live keys.** Replace the sandbox values in Netlify with live ones: `STRIPE_SECRET_KEY` (sk_live_…).
- [x] **Stripe live prices.** Found by lookup keys `motiv_monthly`, `motiv_annual`, `motiv_lifetime`, tagged in live (#87). After #87 ships, remove `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` and `STRIPE_PRICE_LIFETIME` from Netlify.
- [ ] **Stripe live webhook.** Create the same destination in live mode (same URL and 7 events, snapshot payload) and set its `STRIPE_WEBHOOK_SECRET`.
- [ ] **Turn sales tax back on** on /admin/settings (it is off only for sandbox testing).
- [ ] **Customer portal** configured in live mode (payment methods, invoice history, cancel).
- [ ] **Tax registrations** confirmed with your accountant (California and any other states or countries where you must collect).
- [ ] **Legal review** of /privacy, /terms, /motiv/privacy and /motiv/eula (drafted and live), then update PRIVACY_POLICY.md and EULA.md in the Motiv repo to match.
- [ ] **Stripe public details:** add https://emruz.com/terms and https://emruz.com/privacy under Settings > Public details (live and sandbox).
- [ ] **Open sales:** turn on Motiv sales open on /admin/settings.
- [ ] **Downloads.** Signed and notarized Mac build, Windows build, and download links on the account page.
- [ ] **Test purchase** in live mode with a real card, then refund it.

## Before selling Emruz kits (#68)

- [ ] **Webhook event:** add `checkout.session.async_payment_succeeded` to the sandbox and live webhook destinations (and to `stripe listen --events` locally).
- [ ] **Stripe live products and prices** for the kits, with the same lookup keys as the sandbox (`kits_<pack>_<plan>`, plus `kits_all_lifetime`) and tax code `txcd_10103001`.
- [ ] **Kits license terms.** Add kit terms (one-time held at release, upgrades, subscriptions, founding lifetime "for as long as Emruz offers the kits", 14-day refund, one person per purchase) to /terms or a kits license; legal review.
- [ ] **Open sales:** turn on Kits sales open on /admin/settings. The founding lifetime offer runs for 152 buyers or until 2027-12-31.
- [ ] **Test purchase** of each plan in the sandbox (one-time, upgrade, monthly, annual, lifetime), a cancel and a refund.

## Sign-in providers

- [x] Microsoft (redirect fix: always return to the public site address)
- [x] Google (OAuth client)
- [ ] Apple (Services ID and key; needs the paid Apple Developer account)

## Site content

- [ ] Confirm which capabilities sit in each EDR / MDR / XDR / ΔDR tier (`src/content/packages.ts`).
- [ ] Fill out the thin Data Science, AI and Security Ops pages.
- [ ] Confirm info@emruz.com receives contact form email (or change Contact form to on /admin/settings). Messages are also saved at /admin/messages.
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
