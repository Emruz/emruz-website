# PR review: feature/91-kits-two-paths

Commit: 4bee41efe703570f011ca9acb95a9c9484953eb9
Base: 5d68f0828f9f36d4c51d656b6f256554922a483a
Date: 2026-11-26
Critical: 0
High: 0
Medium: 1
Low: 0

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 10, lines changed: +140/-54 (commits aab4a4f #78, 0fa9a6d #91, 4bee41e release v202611.13)
- Skipped: package-lock.json (lockfile, version bump only)
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes
- Sensitive paths touched: auth (sign-in return path: src/lib/signin-next.ts, src/lib/server/session.ts, src/components/AccountMenu.tsx, src/components/Header.tsx); payments (buy buttons and checkout form: src/app/kits/page.tsx). No data deletion.

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| logic-1 | Medium | Banner hides the lifetime offer from bundle subscribers and current one-time bundle owners | src/app/kits/page.tsx:254 (with :206) | Check `lifetime` before `ownsBundle` in the banner |

### logic-1 Banner hides the lifetime offer from bundle subscribers and current one-time bundle owners
- Problem: The banner checks `ownsBundle` before `lifetime`. A monthly or annual subscriber to the all-kits bundle, or a one-time buyer of the latest bundle, has `holding('all', …).state === 'latest'`, so they see "You have every kit" and no Buy lifetime button. `canBuy` still allows these accounts to buy lifetime ("A subscriber may move to lifetime"), and `lifetimeForMe` is true for them. Before this change, `LifetimeRow` rendered on the bundle card above the `owned` check. The diff removed it, so the upgrade from subscription to lifetime is no longer offered anywhere on /kits.
- Evidence: page.tsx:206 `const ownsBundle = !!(account && latest && holding(BUNDLE_PACK, ents, latest).state === 'latest');`; page.tsx:254 `{ownsBundle ? (… You have every kit …) : lifetime ? (… Buy lifetime …)`; page.tsx:52 `lifetimeForMe = life.open && (!latest || canBuy(LIFETIME_PACK, 'lifetime', ents, latest, [], true).ok)`; sales-core.ts:53 (throughRef null gives 'latest'); sales-core.ts:71 and :77 (lifetime is refused only for a lifetime entitlement or a non-subscription open grant).
- Fix: Reorder the banner to `lifetime ? (…) : ownsBundle ? (…) : (…)`. Lifetime owners and staff grants still see "You have every kit", because `lifetimeForMe` is already false for them. Add a kits test for the subscriber case.
- Verifier: confirmed, Medium. The page hides an offer the account can buy. No wrong charge and no data loss. edge-1 merged as a duplicate.

## Checked, no finding
- src/lib/signin-next.ts:4-6: `safeNext` is copied unchanged from session.ts and rejects non-`/`, `//` and `/\`. Only the default fallback changed, `/motiv/account` to `/`, as #78 intends. The module holds no secrets or server imports, so it is safe in the client bundle.
- src/lib/signin-next.ts:9-13: `signInHref` checks the path, URL-encodes it, and returns plain `/signin` for null, unsafe, `/signin`, `/signin/*` and `/auth/*` paths. No loop and no link to another site.
- src/lib/server/session.ts:189: the re-export keeps the name and signature. No cookie, token or session handling changed.
- Callers of the new default: signin/page.tsx:22, auth/[provider]/route.ts:12, auth/email/route.ts:16, auth/verify/confirm/route.ts:52, auth/callback/[provider]/route.ts:66. Each still runs `safeNext`. With no `next` they land on `/`. Redirects that need the account page pass an explicit `next`.
- src/components/AccountMenu.tsx:151 and src/components/Header.tsx:276: `signInHref(pathname)` from `usePathname()`. The server checks `next` again before any redirect. Server and client give the same link, so no hydration mismatch.
- src/app/kits/page.tsx:72-95: `form={BUY_FORM}` on BuyButton. Every BuyButton, the banner one included, renders only when `open`, which is also when `<form id={BUY_FORM}>` exists. No orphan submit.
- src/app/kits/page.tsx:205: the lifetime price shown is `bundle.prices.lifetime`, and the button posts `LIFETIME_PACK`. Both are 'all', so the price and the product match. The "left" count can't be 0 or less, because `lifetimeForMe` requires the offer to be open (sold < cap).
- src/app/api/kits/checkout/route.ts:19-71 (unchanged, followed from the page): checks the request is same-site, sales are open, the plan is valid, the user is signed in and not impersonating, and applies a rate limit. It also checks `lifetimeOffer().open` (:43) and `canBuy` (:44), and takes the price from a server-side Stripe price ID (:46). No amount or currency comes from the client.
- src/app/kits/page.tsx (banner fallback, `#bundle` and `#how` anchors, missing lead or bundle): guarded, and both anchors exist.
- Performance: one added `holding()` call over in-memory entitlements. No new DB or remote calls, no N+1.

## Dropped
- edge-1: duplicate of logic-1 (same code, same fix).

## Not reviewed
- Runtime behaviour: nothing was run. Findings come from reading the code. The test files were read but not executed for this review.
- Pre-existing, outside this diff (raised by the injection and sensitive-path lanes, not counted): `safeNext` doesn't reject control characters. `next=/\t/evil.example` passes the check, and `new URL(next, SITE_URL)` in auth/callback/[provider]/route.ts:66 and auth/verify/confirm/route.ts:52 strips the tab, so the result could be `//evil.example`, an open redirect. Needs a check and a separate issue. A possible fix: reject `/[\x00-\x1f\\]/` in `safeNext`, or require `new URL(next, SITE_URL).origin === SITE_URL`.
- Copy-only files: CHANGELOG.md, docs/emruz-kits-mcp.md and package.json (version) were read for consistency only.
