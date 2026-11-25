# PR review: feature/68-pack-access

Commit: c42072cfaa03a998892101e8389efd07bec484f2
Base: 976c2946311c652e877ee64dfa05bd29554d7423
Date: 2026-11-25
Critical: 0
High: 2
Medium: 5
Low: 12

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 46 code, migration and test files of 56 changed; lines changed: +3435/-45
- Skipped: package-lock.json (lockfile), LAUNCH/ (lawyer-questions.md, name-check.md). Not reviewed by a lane: CHANGELOG.md, docs/emruz-kits-mcp.md, docs/open-items.md, .env.example, package.json (version bump only)
- Diff over 1,500 lines: files were split by area. The logic, injection and edge-case lanes got all server, route and page code; the sensitive-paths lane got the auth, payments and deletion files and read each in full.
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes
- Sensitive paths touched: auth (OAuth server and MCP endpoint), payments (kit checkout, billing portal, Stripe webhook, refunds), data deletion (purge job, grant revocation, cascades from migration 021)

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| inj-1 | High | Requests without a token use up the global MCP limit and lock out every paying user | src/app/api/mcp/route.ts:25 | Verify the token first; apply only the per-IP limit to requests without a valid token; count only signed requests toward mcpTotal |
| sens-1 | High | Claiming an email deletes the merged account's kit entitlements through the new cascade | src/lib/server/accounts.ts:95-97 | Move kit_entitlements (and revoke oauth_grants with an audit row) to the surviving account before the delete |
| inj-2 | Medium | One IP can use up the global registration limit for everyone | src/lib/server/kits/limits.ts:34 | Put registerPerIp before registerTotal |
| logic-1 | Medium | An `unpaid` kit subscription stays revoked after it returns to active | src/lib/server/kits/sales-core.ts:85 | Drop `unpaid` from subscriptionEnded, or restore Stripe-revoked rows on active |
| logic-2 | Medium | Delayed payment methods are never granted | src/lib/server/kits/sales.ts:73 | Set payment_method_types on the session, or handle checkout.session.async_payment_succeeded |
| logic-3 | Medium | Admin revoke of a purchased kit subscription leaves Stripe billing | src/app/admin/kits/actions.ts:52-54 | Cancel stripe_subscription_id before setting revoked_at |
| edge-4 | Medium | On a cold start a GitHub failure throws before the saved last-good release is used | src/lib/server/kits/content.ts:184 | Catch listRefs() failure and fall back to [] so the last-good path runs |
| inj-3 | Low | `/kits?notice=__proto__` crashes the page | src/app/kits/page.tsx:217-218 | Look up only own keys (Object.hasOwn) or use a Map |
| inj-4 | Low | Kit portal and checkout routes do not refuse impersonation sessions | src/app/api/kits/portal/route.ts:12-16 | Return early when account.impersonatedBy is set (portal and checkout) |
| logic-4 | Low | Eligibility checked only at checkout start; two paid sessions both grant | src/app/api/kits/checkout/route.ts:31 | Re-run canBuy in onKitCheckoutCompleted and flag or refund on failure; set expires_at on all kit sessions |
| logic-5 | Low | Audit failure after the grant means the retry skips the purchase email | src/lib/server/kits/sales.ts:91-95 | Wrap the audit in try/catch, log only |
| logic-6 | Low | A refund handled before checkout completes leaves the kit granted | src/lib/server/stripe.ts:196-198 | In payment mode, check the latest charge is not refunded before granting |
| edge-3 | Low | Lost refresh response is treated as reuse and revokes the grant | src/lib/server/kits/oauth-core.ts:351-357 | Short grace window after used_at, or mark used and insert the new pair in one transaction |
| edge-8 | Low | Partial failure during refund leaves upgrades active on retry | src/lib/server/kits/sales.ts:117-131 | Revoke upgrades before, or in the same transaction as, the purchase row |
| edge-9 | Low | Admin page loads up to 10 bundles into a 6-entry FIFO cache, evicting the latest | src/lib/server/kits/content.ts:166,220 | Check releases without caching them, or make the cache LRU |
| edge-10 | Low | Stripe errors in checkout and portal show a raw 500 | src/app/api/kits/checkout/route.ts:39 | Wrap the Stripe call in try, log, redirect to ?notice=unavailable |
| edge-11 | Low | Admin summary caps the active grant count at 500 | src/app/admin/kits/page.tsx:31,42 | Separate count(*) |
| sens-6 | Low | Revoking with a refresh token spends it even when client_id does not match | src/lib/server/kits/oauth-core.ts:376-384 | Look the token up read-only in revoke instead of calling useRefresh |
| sens-7 | Low | A held older release is read without checking the skill's pack in that release | src/lib/server/kits/protocol.ts:125-131,142-147 | Return null when own.pack !== item.pack |

### inj-1 Requests without a token use up the global MCP limit and lock out every paying user
- Problem: every POST to /api/mcp adds to the shared `mcpTotal` counter (5000/h) before the token is checked and before the per-IP limit for requests without a token (60/h). Rejected requests still count. One IP sending about 1.4 requests a second fills the hour, and every token holder gets 429 until it resets.
- Evidence: `const total = await limited(rules.mcpTotal()); if (total) return tooMany(total);` at :25, before `verifyAccessToken` at :30 and `limited(rules.mcpAnon(ip(req)))` at :32. The limiter increments on every call (src/lib/server/db.ts:41-49).
- Fix: run `verifyAccessToken` first (a local signature check, no database). For a missing or invalid token apply only `mcpAnon(ip)`. Count only requests with a valid signature toward `mcpTotal`.
- Verifier: confirmed, High.

### sens-1 Claiming an email deletes the merged account's kit entitlements through the new cascade
- Problem: `claimEmail` moves only `subscriptions` and `identities` from the other account, then deletes it. Migration 021 adds `on delete cascade` from `kit_entitlements`, `oauth_grants` and `oauth_codes` to `accounts`. Paid kit access on the other account (once, upgrade, subscription, lifetime) and staff grants are deleted for good. A kit subscription keeps billing in Stripe with no row left, so later refund or subscription events find nothing and the Manage billing link disappears. Reached by any signed-in user through /auth/verify/confirm (route.ts:26-29).
- Evidence: `update subscriptions set account_id = ${accountId} where account_id = ${other.id}`; `update identities ...`; `delete from accounts where id = ${other.id}`; migration 021:55 `account_id uuid not null references accounts(id) on delete cascade`.
- Fix: before the delete in `claimEmail`, `update kit_entitlements set account_id = ${accountId} where account_id = ${other.id}`. Revoke the other account's `oauth_grants` with an audit row rather than letting them cascade silently.
- Verifier: confirmed, High. `claimEmail` predates this diff; the cascade that makes it lose kit data is new here.

## Checked, no finding
- src/lib/server/kits/oauth-core.ts:118-153: redirect URIs allow https, loopback http and dotted private schemes only; match is exact apart from the loopback port.
- src/lib/server/kits/oauth-core.ts:223-248: unknown client or redirect shows an error and never redirects; PKCE S256 required; scope and resource checked.
- src/lib/server/kits/oauth-core.ts:328-346: code deleted before any check (single use); client_id, expiry, exact redirect_uri and PKCE verifier compared in constant time.
- src/lib/server/kits/oauth-core.ts:279-311, 390-393: access tokens pin issuer, audience, typ, kid and algorithm; each MCP call re-checks the grant's account, client and revoked state.
- src/lib/server/kits/store.ts:22-29, 51-60: codes taken by atomic delete-returning; refresh tokens single use through a conditional update; stored as SHA-256 hashes.
- src/lib/server/kits/store.ts:125-133: `revokeOwnGrant` scoped by account_id and audited.
- src/lib/server/kits/server.ts:25-31, 50-69: wildcard CORS only on bearer endpoints without cookies; body size cap; repeated parameters rejected.
- src/lib/server/kits/protocol.ts:137-150 and content.ts:237-247: `..` rejected; files read from an in-memory archive map; access decided on every call.
- src/lib/server/kits/content.ts:28-43, 104-148 and content-core.ts:125-157: repo name validated; downloads limited to GitHub asset URLs and checked against SHA256SUMS; tar reader rejects `..`, links and absolute paths and caps size and entries; token kept out of error text.
- src/app/api/mcp/route.ts:28-71: batches rejected; body capped at 64 KB; entitlements read fresh for claims.sub.
- src/app/api/oauth/consent/route.ts:16-43: same-origin, signed-in, impersonation refused, authorization re-checked on the server.
- src/app/api/oauth/register, token, revoke routes: rate limited, size capped, generic errors; client name stripped of control characters and capped.
- src/app/oauth/authorize/page.tsx:39-68 and Consent.tsx:15-22: sign-in before checks; error links shown for a click only after the redirect URI is verified; navigation only to server-built URLs; framing blocked (next.config.ts:8, src/proxy.ts:27).
- src/app/.well-known/* routes: serve metadata from oauth-core.ts:86-111, advertising S256 and `none` client auth only.
- src/app/motiv/account/actions.ts:37-45 and KitsSection.tsx:12-83: scoped to account.id; disconnect blocked for impersonation; grant id UUID-checked; billing and disconnect hidden in read-only mode.
- src/app/admin/kits/actions.ts:13-44 and page.tsx:12-44: admin plus recent sign-in; inputs validated; parameterized; audited (revoke gap in logic-3).
- src/app/api/kits/checkout/route.ts:15-56: same-origin, signed-in, rate limited; price from a server lookup key so amount and currency come from Stripe; account and release set in metadata on the server; lifetime expires_at 35 minutes, in seconds.
- src/app/api/kits/portal/route.ts:16-18: entitlement UUID-checked and scoped by account_id.
- src/app/api/stripe/webhook/route.ts:22-63: signature checked; event-id dedupe with rollback on failure; kit routing by metadata on signed events; refunds act only when fully refunded, disputes only when lost.
- src/lib/server/stripe.ts:167-203: kit handler runs only when no Motiv licence matched; subId now passed through for subscription charges.
- src/lib/server/kits/sales.ts:18-35, 66-95, 110-134: price cache; lifetime count; insert idempotent by the unique checkout-session index; refund cancels the Stripe subscription before revoking.
- src/lib/server/kits/sales-core.ts:47-82: `holding` and `canBuy` handle no entitlements, the all-kits bundle, staff grants, upgrades and lifetime.
- src/lib/server/db.ts:36-55: `rateLimitCheck` parameterized, positive retryAfter; `rateLimit` behaviour unchanged.
- src/lib/server/alerts.ts: two new event kinds with thresholds and cooldowns; alert keys hold no tokens or emails.
- netlify/database/migrations/021_mcp_oauth.sql: new tables only; hashes as primary keys; regex checks on pack and through_ref (cascade risk in sens-1).
- netlify/database/migrations/022_kit_sales.sql: nullable columns only; partial unique index matches the `on conflict ... where` in onKitCheckoutCompleted.
- netlify/functions/purge-deleted.mts:23-30: fixed deletes with no input; expired codes and refresh tokens, grants revoked over a year ago, clients unused for 30 days with no grant, audit rows over a year old. Used refresh tokens kept until expiry, so reuse detection still works.
- src/content/kits.ts:13-42: display prices only; the charge uses the Stripe price.
- src/app/kits/thanks/page.tsx:8-37: static; ignores session_id.

## Dropped
- edge-1: duplicate of inj-1.
- edge-2: duplicate of inj-2.
- edge-5, sens-3: duplicates of logic-2.
- edge-6, sens-4: duplicates of logic-1.
- edge-7, sens-5: duplicates of logic-4. sens-5 adds that non-lifetime kit sessions use Stripe's default expiry and that an upgrade can complete after its base purchase is refunded; folded into logic-4's fix.
- sens-2: duplicate of logic-3.
- Severity lowered by the verifier: inj-3 Medium to Low (affects only the visitor of the crafted URL, nothing stored); edge-3 Medium to Low (strict refresh rotation as OAuth 2.1 recommends; cost is a forced reconnect and a false alert).

## Not reviewed
- Runtime behaviour: nothing was run. Tests, the dev server and Stripe or GitHub calls were not exercised.
- Stripe Dashboard settings that decide whether logic-1 and logic-2 happen (failed-retry action, enabled payment methods).
- Netlify environment variables, Blobs contents and the GitHub release repo.
- Two lanes (logic, sensitive paths) lost shell access partway and read the later files whole with Read rather than from the diff; the logic lane did not diff src/app/motiv/account/page.tsx or the .well-known routes. The injection lane covered both.
- CHANGELOG.md, docs/*.md, .env.example, package-lock.json, LAUNCH/ files.
- src/components/AccountMenu.tsx, src/components/Footer.tsx, src/content/navigation.ts, src/app/page.tsx, src/app/services/page.tsx, src/app/sitemap.ts: link and copy changes, not given a dedicated lane pass beyond the edge-case lane's file list.
