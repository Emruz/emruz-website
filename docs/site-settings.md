# Site settings (#74)

Business settings live in the database (`site_settings`, migration 027) and are changed on `/admin/settings`. A change is live within 30 seconds, with no redeploy. Changing them needs an admin who signed in recently. Every change is recorded in the `events` table (kind `setting_changed`, with who, the old value and the new value) and listed under Recent changes on the page. An empty field uses the default.

| Setting | Replaces | Default | Checked |
|---|---|---|---|
| Kits sales open | `KITS_SALES_OPEN` | Off | On or off |
| Founding lifetime offer ends | `KITS_LIFETIME_UNTIL` | 2027-12-31 | A real day; a past day ends the offer |
| Hold kits at release | `SKILLS_REF` | Not held (newest release) | A tag that loads and passes its checksums |
| Motiv sales open | `MOTIV_SALES_OPEN` | Off | On or off |
| Computers per new licence | `MOTIV_DEFAULT_SEATS` | 2 | 1 to 50 |
| Lease length (days) | `MOTIV_LEASE_DAYS` | 14 | 1 to 60 |
| Past-due grace (days) | `MOTIV_PAST_DUE_GRACE_DAYS` | 7 | 0 to 30 |
| Motiv Pro monthly, annual, lifetime price | `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_LIFETIME` | Not set (that checkout is off) | Exists in this Stripe account, active, in USD, not a kits price, recurs monthly, recurs yearly, or is one time. The three may be one product or separate products |
| Sales tax at checkout | `STRIPE_AUTOMATIC_TAX` | On | On or off (off only in a sandbox) |
| Contact form to | `CONTACT_TO` | info@emruz.com | One email address |
| Assessment notices to | `ASSESSMENT_NOTIFY_TO` | sales@emruz.com | One email address |
| Security alerts to | `ALERT_EMAILS` | Not set (`ADMIN_EMAILS`) | Up to 20 addresses, comma-separated |
| Reply-to address | `EMAIL_REPLY_TO` | info@emruz.com | One email address |

The kits launch date (#71) is stored here too, as `kits_launch_date`, and is set on `/admin/kits`.

Until a setting is saved on `/admin/settings`, the site reads the Netlify variable it replaced (if set and valid), so nothing changes on deploy. Once saved, the database value wins. The page shows each value in effect and where it comes from (saved, Netlify variable or default), and fills the form with any Netlify value still in effect, so saving the form keeps it. Choosing Default or emptying a field while the Netlify variable is still set saves an explicit clear, so the default applies and the variable no longer does. The page names any variable still set in Netlify so it can be removed after its value is saved.

If the database can't be read, the site uses the last values it read and tries again after 5 seconds. A server instance that has never read them uses the Netlify variables and defaults, and the kits keep serving the last good release rather than move to the newest, since the release hold is unknown.

## Kept in Netlify

Secrets, the database URL, `ADMIN_EMAILS`, values paired with a secret (`MOTIV_LICENSE_KID`, `MCP_TOKEN_KID`, `SKILLS_REPO`, `MOTIV_CRASH_REPO`, OAuth client IDs, `EMAIL_FROM`), and platform and build-time values (`SITE_URL`, `NEXT_PUBLIC_SITE_URL`). See `.env.example`.

## Moving production over

1. After the deploy, open `/admin/settings` and enter the values that were set in Netlify (price IDs, sales switches, sales tax, any addresses). Until then the defaults apply: sales closed and no Motiv prices.
2. Remove the old variables from Netlify: `npx netlify env:unset <NAME>` for each one the page lists. No redeploy is needed for this.
