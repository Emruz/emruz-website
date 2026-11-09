# Motiv backend on emruz.com: setup

The site hosts Motiv's licensing API, checkout, member sign-in, the `/activate`
pairing page, the account page and an admin view. Code lives in `src/lib/server/`,
`src/app/api/`, `src/app/auth/` and the pages under `/activate`, `/signin`,
`/motiv/account` and `/admin/motiv`. Every variable is listed in `.env.example`.

## 1. Database (Netlify Database)
The `@netlify/database` package is installed, so Netlify provisions a Postgres database on the next deploy and sets `NETLIFY_DB_URL`. Migrations in `netlify/database/migrations/` are applied automatically before each deploy is published (deploy previews get their own database branch). Never edit a migration once it has been applied; add a new numbered file.

Check with `npx netlify db status`.

## 2. Lease signing key
Set `MOTIV_LICENSE_PRIVATE_KEY` in Netlify (Site settings > Environment variables, mark it secret) to the contents of `license-keys/private.pem` from beside the Motiv repo. `MOTIV_LICENSE_KID=k1`. Never commit the key.

Check signing still matches the app: `npm run test:lease` (uses the test vectors copied from the Motiv repo into `tests/`; copy them again whenever the app regenerates them).

## 3. Stripe
1. Turn on Stripe Tax and add your tax registrations.
2. Create one product "Motiv Premium" with three prices: $9/month recurring, $99/year recurring, $299 one-time. Set each price's tax behavior. Put the price IDs in `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_LIFETIME`.
3. Add a webhook endpoint `https://emruz.com/api/stripe/webhook` for: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `charge.dispute.closed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Configure the Customer Portal (Settings > Billing > Customer portal): allow cancel, update payment method and invoice history.
5. Set `STRIPE_SECRET_KEY`. Use test-mode keys first; `stripe listen --forward-to localhost:8888/api/stripe/webhook` works with `netlify dev`.
6. When ready to sell, set `MOTIV_SALES_OPEN=true` and redeploy. Until then /motiv shows prices with "Get notified at launch".

## 4. Email (Resend)
Create a Resend account, verify the emruz.com domain (DNS records), set `RESEND_API_KEY` and `EMAIL_FROM`. Without a key in development, emails print to the server log.

## 5. Sign-in providers
Redirect URIs are `https://emruz.com/auth/callback/<provider>`. A provider's button appears only when its variables are set; the email link always works.

- **Microsoft:** Entra admin center > App registrations > New. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts". Web redirect URI as above. Create a client secret. Under Token configuration add optional ID token claims `email` and `xms_edov` (without `xms_edov`, Microsoft emails are treated as unverified and won't auto-link to purchases; users can still add their purchase email from the account page).
- **Google:** Google Cloud console > APIs & Services > Credentials > OAuth client ID (Web). Authorized redirect URI as above. Publish the consent screen.
- **Apple:** Apple Developer > Identifiers: an App ID with Sign in with Apple, then a Services ID (this is `APPLE_CLIENT_ID`) with emruz.com as domain and the redirect URI as above. Keys: create a key with Sign in with Apple, download the .p8 (`APPLE_PRIVATE_KEY`), note its Key ID (`APPLE_KEY_ID`) and your Team ID (`APPLE_TEAM_ID`).

## 6. Admin
Set `ADMIN_EMAILS` to your email. Sign in and open `/admin/motiv` (also linked from your account page) to search, grant complimentary subscriptions, revoke, reinstate, change seats and remove computers.

## How it fits together
- **Purchase:** /motiv Buy > Stripe Checkout > webhook creates the subscription, attaches it to the account with that email (creating one if needed) and emails the subscription ID.
- **Register a computer:** Motiv calls `/api/motiv/v1/pair/start` and shows a code > the customer signs in at `/activate`, picks a subscription and approves > Motiv's next poll receives the lease.
- **Check-in:** Motiv calls `/api/motiv/v1/checkin` daily and gets a fresh 14-day lease, or an error (revoked, canceled, expired, past due) that turns Premium off.
- **Refunds:** a full refund or lost dispute on a lifetime purchase revokes it automatically. For monthly and annual, cancel in Stripe (or revoke in admin).
- **Apple Hide My Email:** the account page lets a signed-in user prove a purchase email by link, which moves those purchases to their account.

## Not done yet
- Downloads on the account page (waiting for public releases).
- Privacy and Terms pages: the footer links to /privacy and /terms, which don't exist yet. Motiv's PRIVACY_POLICY.md and EULA.md should be published there before selling.
