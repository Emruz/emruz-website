# PR review: feature/89-save-bar

Commit: 9c11b31041935e4af631ba815dc4429a2e5ff4fd
Base: 6fba3e17fa8d19fbfc4b4949ff75ac143e182909
Date: 2026-11-26
Critical: 0
High: 0
Medium: 0
Low: 2

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- The branch carries 7 commits not on main (#83, #85 x2, #86, #87, #88, #89). All are reviewed together against the merge-base with origin/main.
- Files reviewed: 17 (src/app/admin/settings/actions.ts, src/app/admin/settings/page.tsx, src/app/api/kits/checkout/route.ts, src/app/api/motiv/checkout/route.ts, src/app/kits/page.tsx, src/components/AccountMenu.tsx, src/components/SaveBar.tsx, src/components/index.ts, src/lib/server/health.ts, src/lib/server/kits/launch-core.ts, src/lib/server/kits/sales.ts, src/lib/server/motiv-prices.ts, src/lib/server/settings-core.ts, src/lib/server/stripe.ts, scripts/stripe-preview.sh, tests/kits-launch.test.mts, tests/site-settings.test.mts). Lines changed: +254/-170 across all 27 files.
- Skipped: package-lock.json (lockfile), LAUNCH/. No lane reviewed these, because they are text only or a version bump: .env.example (comment), AGENTS.md, CHANGELOG.md, README.md, docs/emruz-kits-mcp.md, docs/motiv-backend-setup.md, docs/open-items.md, docs/site-settings.md, package.json.
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes. Each lane ran as a separate read-only agent, no lane saw another's results or a previous record, and the verifier got only the finding text. No tests were run.
- Sensitive paths touched:
  - Payments: the kits and Motiv checkout routes, src/lib/server/stripe.ts, src/lib/server/motiv-prices.ts, src/lib/server/kits/sales.ts, src/lib/server/kits/launch-core.ts, src/lib/server/health.ts, scripts/stripe-preview.sh.
  - Auth: src/app/admin/settings/actions.ts and page.tsx, and the adminLinks list in src/components/AccountMenu.tsx.
  - No data deletion.

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| edge-1 | Low | The Motiv price cache keeps a "no price" result, or the previous price, for up to 10 minutes per instance | src/lib/server/stripe.ts:24-32 | Cache only a found price. Have the health check skip the cache. Optionally wrap `sessions.create` in the Motiv route so a Stripe refusal redirects to /motiv#plans. |
| edge-2 | Low | The health check calls Stripe once per plan, one call at a time | src/lib/server/health.ts:60-61 | Use one `prices.list` call with all three lookup keys, or `Promise.all` |

### edge-1 The Motiv price cache can be up to 10 minutes out of date
- Problem: `motivPrice` caches each plan's result for 10 minutes, including null.
  - If the `motiv_<plan>` lookup key is tagged in Stripe after a lookup, that plan's checkout stays off for up to 10 minutes, and /admin/motiv health keeps reporting the missing key.
  - If the lookup key is moved to a new price while the old price stays active, checkouts on that instance keep using the old price, and the old amount, for up to 10 minutes.
  - If the old price is archived, `checkout.sessions.create` in src/app/api/motiv/checkout/route.ts:20 is outside any try/catch, so the buyer gets a 500.
- Evidence:
  - stripe.ts:29 `if (hit && Date.now() - hit.at < PRICE_TTL_MS) return hit.price;`
  - stripe.ts:32 `priceCache.set(plan, { price, at: Date.now() });`, where `price` may be null.
- Fix: Only call `priceCache.set` when a price is found. Give `motivPrice` a way to skip the cache and use it from health.ts. Optionally catch a failure in `sessions.create`, clear the plan's cache entry and redirect to /motiv#plans.
- Before shipping: tag `motiv_monthly`, `motiv_annual` and `motiv_lifetime` in the live Stripe account before this deploys. Otherwise Motiv checkout turns off, and /admin/motiv health shows which key is missing.
- Verifier: lowered from Medium to Low. logic-1, sens-1 and sens-2 merged into it as duplicates.
  - The 500 already existed at base: the base route also called `sessions.create` with no try/catch.
  - The base price ID was checked only when it was saved, so it could go stale for any length of time. At head, staleness is capped at 10 minutes and only active prices are returned.
  - Only the cached null is new. It is temporary, and it follows the kits pattern in src/lib/server/kits/sales.ts:17-29.

### edge-2 Health check makes up to three Stripe calls in a row
- Problem: On a cache miss, /admin/motiv waits for up to 3 `prices.list` calls, one after another, before it renders. Requests that miss the cache at the same time each call Stripe.
- Evidence: health.ts:60-61 `for (const p of PLANS) { const problem = await motivPriceProblem(p).catch(...)`
- Fix: `prices.list({ lookup_keys: PLANS.map(motivLookupKey), active: true })` once, then check each plan from the result. Or run the three calls with `Promise.all`.
- Verifier: confirmed, Low. It runs on an admin page only, and loads in the next 10 minutes use the cache.

## Checked, no finding
- src/app/api/kits/checkout/route.ts:
  - The same-origin check, sales switch, sign-in, impersonation block and rate limit are unchanged.
  - The price still comes from the server-side `kitPriceId`.
  - Dropping the form trigger check removes no protection: the trigger is now a required Stripe Checkout custom field (`optional: false`), and nothing from the buyer goes into metadata.
- src/app/api/motiv/checkout/route.ts:13-16: `PLANS.includes(plan)` runs before the lookup, so only the three fixed lookup keys can be queried. A failed lookup is logged and the buyer is redirected. Lifetime checkouts use payment mode and the others use subscription mode, and `priceProblem` requires a one-time or recurring price to match, so the mode always fits the price type.
- src/lib/server/stripe.ts:36-48: `priceId` and `motivPriceProblem` both apply `priceProblem`, so an archived, non-USD, `kits_` or wrong-interval price is never sold. `onCheckoutCompleted` is unchanged and grants once through `on conflict (stripe_checkout_session) do nothing`.
- src/lib/server/motiv-prices.ts: `priceProblem` was moved from settings-core, and only the same-product rule was dropped, as #83 intends. It handles `recurring: null` and a missing `lookup_key`.
- src/lib/server/kits/launch-core.ts (`triggerField`, `triggerFromSession`):
  - Option values are the fixed trigger ids with underscores removed. They are unique and alphanumeric, and `technical_decision` fits the DB check `^[a-z_]{1,40}$`.
  - An unknown dropdown value maps to null.
  - Sessions started before #86 fall back to `metadata.trigger` through `isPurchaseTrigger`, which rejects prototype keys.
- src/lib/server/kits/sales.ts:105: the trigger comes from `triggerFromSession`, and the insert is a parameterised tagged template. `async_payment_succeeded` carries the same session with its custom_fields and grants once through the same `on conflict` insert.
- src/app/api/stripe/webhook/route.ts (followed, not changed): the signature is verified, each event is recorded and handled once, and `async_payment_succeeded` is routed only for kits sessions.
- scripts/stripe-preview.sh: only the fixed event list changed, adding `checkout.session.async_payment_succeeded`. It affects test forwarding to previews only.
- src/lib/server/health.ts:59-64: runs only when `STRIPE_SECRET_KEY` is set. Its only caller is /admin/motiv, which is admin-only.
- src/app/admin/settings/actions.ts: the admin gate (signed in, `isAdmin`, recent sign-in) is unchanged. Removing `checkPrices` takes Stripe calls and a Stripe-bound admin input out of the save. Old `stripe_price_*` rows are ignored, and `saveSetting` rejects unknown keys.
- src/app/admin/settings/page.tsx: `SaveBar` is the first element inside the form and inside the disabled fieldset, so it is disabled while a fresh sign-in is needed. There is no second Save button. Old change-log rows for `stripe_price_*` show the raw key.
- src/components/AccountMenu.tsx:101: the new link is inside `adminLinks`, which returns [] for non-admins, and the page enforces admin access itself.
- src/components/SaveBar.tsx: display only. The button defaults to submit and passes `form` through.
- src/app/kits/page.tsx: removing the trigger select and `canBuyAny` leaves no unused branch. Notices are still looked up with `Object.hasOwn` and rendered as text.
- Callers of removed exports: `stripePrices`, `isPriceId`, the `price` setting kind, the `plan` setting field, and `priceProblem`/`PriceFacts`/`CURRENCY` from settings-core have no remaining references in src. `priceId` has one caller, the Motiv route, and it awaits the result.

## Dropped
- inj-1 (Stripe raw error text on the health panel): admin-only, since /admin/motiv calls notFound() for non-admins. Stripe masks the key in its error, and the same `msg(e)` already shows DB errors there.
- edge-3 (silent redirect when the Motiv price is missing; page prices not compared with Stripe): not introduced by this diff. The base route redirected the same way, and src/app/motiv/page.tsx is unchanged.
- logic-1, sens-1, sens-2: duplicates of edge-1.
- sens-3 (`priceProblem` accepts custom-amount, metered or tiered prices): not introduced. The base save-time check had the same gap, and an admin would have to tag such a price.
- sens-4 (the `kits_` lookup key check can no longer fire): dead code, but harmless.

## Not reviewed
- Runtime behaviour: no tests, app or Stripe calls were run.
- Live Stripe account state: whether the `motiv_<plan>` lookup keys are tagged, and the actual price amounts.
- Pre-existing and outside this diff, noted by the sensitive-paths lane: `onCheckoutCompleted` for Motiv does not check `payment_status`, and Motiv `async_payment_succeeded` events are not routed. If Motiv checkout allows delayed payment methods, a licence could be granted before payment clears. Track it separately.
- The text-only files listed under Skipped.
