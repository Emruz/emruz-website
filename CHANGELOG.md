# Changelog

What changed in each release of emruz.com, newest first.

Releases are numbered vYYYYMM.#: the year and month, then the release number in that month. The first release of a month is .1. `npm run bump` sets the next number in package.json (stored as YYYYMM.#.0 because npm needs three parts). Before `npm run ship`, add a `## vYYYYMM.#` section here for that number; ship stops if it is missing.

## v202611.9

- Kits review follow-ups (#70): account merges run in one transaction and a purchase that confirms after its account was merged goes to the account that kept it; kit subscriptions act on their current state in Stripe, follow a plan switch to another kit, and stay ended after a refund; the per-account MCP limit applies before the global one; two kits release items can't share a folder; revoking from the wrong client no longer spends the real client's refresh token; staff revoke keeps its reason; staff are alerted if the lifetime offer sells past its cap.
- Kits launch conditions (#71): `/kits` leads with the Release Kit, with the Founder and Marketing Kits as add-ons and the all-kits bundle after them. New `/kits/security` security and data statement for the kits MCP server, linked from `/kits`, the app consent page and the privacy policy. The buy form asks what made the buyer buy now and stores it with the purchase; kit subscriptions store whether they are monthly or annual (migration 024). `/admin/kits` shows paying accounts outside Emruz (leaving out emruz.com, admins and email addresses staff add on the page, migration 025) by kit and plan, free-to-paid conversion, purchase triggers, founding lifetime sold, and the 90-day review against the kill lines from a launch date set on the page (migration 026). A results section on `/kits` appears once there are published customer results.
- Site settings (#74): business settings move from Netlify environment variables to the database (migration 027) and are changed on the new `/admin/settings` page, live within 30 seconds with no redeploy: the kits and Motiv sales switches, the founding lifetime offer's last day, the kits release hold, Motiv seats, lease length and past-due grace, the Motiv Stripe price IDs, sales tax at checkout, and the contact, assessment, alert and reply-to addresses. Each value is checked (days, number ranges, email addresses, Stripe price IDs against Stripe, release tags against the release), needs a recent sign-in, and every change is logged with who, the old value and the new value. The kits launch date moves to the same table. The old variables are no longer read; the page lists any still set in Netlify. See `docs/site-settings.md`.

## v202611.8

- Emruz kits over MCP (#67): emruz.com serves the Emruz kits to Claude and other MCP apps at `/api/mcp`, with emruz.com as the OAuth 2.1 sign-in. Free skills work with any account; paid skills need an entitlement for their pack. Staff grant and revoke kits on `/admin/kits`; accounts see their kits and disconnect apps on `/motiv/account#kits`. The site follows the newest published emruz-kits release (or `SKILLS_REF`). Migration 021.
- Kit packs on sale (#68): new `/kits` page in the main menu with the Release, Founder and Marketing Kits and an all-kits bundle. Each can be bought once (held at the release bought, with a lower upgrade price for newer releases) or by monthly or annual subscription (always the latest release). Checkout needs a signed-in account; buy buttons show when `KITS_SALES_OPEN=true`. Stripe prices are found by lookup key, so no price environment variables. A founding lifetime offer on All kits ($549, every future release) runs for the first 152 buyers, until 31 December 2027. Subscriptions that end, refunds and lost disputes end the kit; subscribers manage billing from the account page. Migration 022.
- Review fixes (#68): merging accounts moves kit purchases instead of deleting them (migration 023 stops kit purchases being deleted with an account); anonymous MCP traffic no longer counts toward the global MCP limit; per-IP limits apply before shared totals; an older held release serves only skills from the same pack; the site keeps serving the last good kits release when GitHub is unreachable at start-up; delayed payment methods grant the kit when the payment confirms; an unpaid kit subscription that is paid again gets its access back; staff revoking a purchased kit subscription cancels it in Stripe; checkout and billing errors show a message instead of an error page; staff viewing as a customer cannot buy or open billing.

## v202611.7

- `npm run ship -- "Title" --review` runs the PR review in Claude Code without opening it, then ships. It runs only when the branch has no valid review record.
- The backup keeps branches and tags deleted on GitHub (no longer pruned). `npm run backup` run by hand now fails when the backup fails; the monthly run from ship still only warns.
- The backup runs when the last one is 30 or more days old. It never prunes, even with fetch.prune set, and shows git's error when a refresh fails.
- `npm run ship` shows check progress on each poll and finishes when GitHub shows the pull request mergeable, or when every check has passed on two polls in a row. A check that has a result counts as done even if GitHub still shows it running. Any failed check stops the merge, a single failed poll is retried, a required check on main that hasn't started counts as waiting, and the wait gives up after 30 minutes (`SHIP_CHECK_TIMEOUT`) with a message.
- `npm run ship` checks the review record before the slow checks, and stops on uncommitted changes other than the record unless `--review` is given. With `--review`, ship stops if the review changed anything other than the record. The push uses `--force-if-includes`, so commits pushed to the branch on GitHub aren't overwritten.
- The review gate counts a deleted file even when git would call it a rename, and reads the first `Commit:` and `Critical:` lines strictly. The pr-review-record check now runs the same gate script.
- Dependabot pull requests pass the review record check with a note, as long as Dependabot made the last push. Don't use Update branch on GitHub; rebase on main instead.
- The pre-push hook blocks pushes to main only, so rebased feature branches can be pushed. The pre-commit hook says "gitleaks error" when gitleaks itself fails. Re-running `scripts/install-hooks.sh` no longer warns about its own hooks.
- The security checks workflow uses the Node version in .nvmrc, like the other checks.
- CODEOWNERS covers scripts/, package.json, netlify.toml and LAUNCH/reviews/. LAUNCH docs mark links to the reports kept out of the repo as local only.

## v202611.6

- `npm run ship` refreshes a mirror backup of the repo in ~/Backups once a month, after the merge. `npm run backup` refreshes it now. A failed backup prints a warning and never stops the ship.

## v202611.5

- `npm test` runs every test file in tests/ and fails if any fails.
- Added `test:revocation`, so the revocation rules are now tested.
- `npm run ship`, `npm run preview` and `npm run local` run the tests after lint (`--fast` skips them in local).
- CI runs `npm test` on every pull request instead of only the licensing tests.
- Added this changelog. `npm run ship` stops when it has no section for the version in package.json, and `npm run bump` reminds you to add one.
- Home page: the Security, Cloud and AI assessment tiles each have their own description, and one Explore All Assessments button replaces the three Learn More buttons.
- Services menu: clicking Services opens the Services page, the arrow next to it opens the menu, and All services is at the top of the menu.
- Managed security: posture, identity, network access, training, data and backup services are individual services, shown with the EDR, MDR, XDR and ΔDR editions on the compare page and no longer called add-ons.
- The capability glossary on the compare page and the EDR, MDR, XDR and ΔDR pages lists the individual services, each linking to its page.
- Schedule buttons open the contact form with the topic filled in: the assessment's name on the Assessments tiles and service pages, or "Assessment" elsewhere.

## v202611.4

- Motiv reports accept problem reports and feature suggestions as well as crashes, and file them with error, bug or enhancement labels.
- Motiv privacy notice covers problem reports and feature suggestions.

## v202611.3

- Managed Security tile in black with a text link.
- Self-Assessment button in page headers and the menu bar; the Assessments menu is gone.
- Live search on every admin and workbench list.

## v202611.2

- Motiv moves to the top-level menu; Managed Security sits under Services.
- The Products page is folded into Services, with a Managed Security tile and the add-on security services.
- Motiv admin: an actions menu on each customer row, including resending the welcome email.

## v202611.1

- Motiv onboarding: download page, step-by-step welcome email and activation help.
- Admin can send the welcome email to one licence or to everyone not yet registered.
- Motiv admin customer list shows registered computers out of seats.
- `npm run ship` and `npm run preview` link the GitHub issue and close it on merge.
- Releases use vYYYYMM.# numbers, set with `npm run bump`.
