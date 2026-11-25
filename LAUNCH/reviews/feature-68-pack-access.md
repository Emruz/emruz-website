# PR review: feature/68-pack-access

Commit: b580f211891aaff531cf95315ceaac4296cd32c0
Base: 976c2946311c652e877ee64dfa05bd29554d7423
Date: 2026-11-25
Critical: 1
High: 1
Medium: 7
Low: 11

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 48 code, migration and test files of 57 changed; lines changed: +3406/-43 (excluding the lockfile and LAUNCH/)
- Skipped: package-lock.json (lockfile), LAUNCH/ (lawyer-questions.md, name-check.md, the previous review record). Not reviewed by a lane: CHANGELOG.md, docs/emruz-kits-mcp.md, docs/open-items.md, .env.example, package.json (version bump only)
- Diff over 1,500 lines. The logic, injection and edge-case lanes each got all the changed server, route and page code; the logic lane also got the tests. The sensitive-paths lane got the auth, payments and deletion files and read each in full.
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes (no prior review or other lane's results given to any lane or to the verifier)
- Sensitive paths touched: auth (OAuth server, MCP endpoint, rate limits), payments (kit checkout, billing portal, Stripe webhook, refunds), data deletion (purge job, grant revocation, cascades from migration 021)
- This review replaces the record for c42072c. b580f21 changed code (oauth-core.ts redirect scheme check) after that record, so the whole branch was reviewed again.

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| sens-1 | Critical | Account merge deletes the merged account's paid kit entitlements through the new cascade | src/lib/server/accounts.ts:93-97; netlify/database/migrations/021_mcp_oauth.sql:55 | Move kit_entitlements (and revoke or move oauth_grants, with an audit row) to the surviving account before the delete; make the FK `on delete restrict` |
| sens-2 | High | One IP's anonymous traffic uses up the global MCP cap and locks out every paying user | src/app/api/mcp/route.ts:25-35 | Verify the token first; anonymous requests hit only mcpAnon(ip); only valid tokens count toward mcpTotal |
| sens-3 | Medium | registerTotal is counted before registerPerIp, so one IP can block new client registration | src/lib/server/kits/limits.ts:34 | Put registerPerIp first |
| sens-5 | Medium | A kit subscription that recovers from `unpaid` stays revoked while billing resumes | src/lib/server/kits/sales.ts:98-104; sales-core.ts:85 | On active or trialing, clear revoked_at where revoked_by='stripe' for that subscription; or treat only canceled and incomplete_expired as ended |
| inj-2 | Medium | A held older release serves a skill found by name without checking its pack in that release | src/lib/server/kits/content.ts:231,244; protocol.ts:125,142 | In readSkill/readFile return null unless `own.pack === item.pack` (or decide against the held manifest) |
| logic-1 | Medium | Admin revoke of a purchased kit subscription leaves Stripe billing | src/app/admin/kits/actions.ts:46-58 | Cancel stripe_subscription_id when set, as revokeKitsForPayment does, before setting revoked_at |
| logic-2 | Medium | On a cold start a GitHub failure throws before the saved last-good release is used | src/lib/server/kits/content.ts:184 | Catch the listRefs() error and fall through to the recorded last-good path |
| logic-3 | Medium | Delayed payment methods are charged but never granted | src/lib/server/kits/sales.ts:73; src/app/api/stripe/webhook/route.ts:34-64 | Set payment_method_types on the session, or handle checkout.session.async_payment_succeeded |
| edge-4 | Medium | Stripe and GitHub errors in kit checkout and portal show a raw 500 | src/app/api/kits/checkout/route.ts:29-56; src/app/api/kits/portal/route.ts:20-24 | Wrap in try/catch, log, redirect with ?notice=unavailable (portal: home) |
| inj-1 | Low | Kit billing portal does not refuse impersonation sessions | src/app/api/kits/portal/route.ts:12-24 | Return early when account.impersonatedBy is set |
| inj-4 | Low | Kit checkout does not refuse impersonation sessions | src/app/api/kits/checkout/route.ts:24 | Same check as inj-1 |
| sens-4 | Low | Token-endpoint per-client limit keyed on a caller-supplied client_id | src/app/api/oauth/token/route.ts:11; limits.ts:24,36 | Key by IP plus client_id, or apply after the code or refresh token is validated |
| inj-3 | Low | `/kits?notice=__proto__` crashes the page | src/app/kits/page.tsx:18,217-218 | Object.hasOwn(notices, notice) or a Map |
| logic-5 | Low | Eligibility and lifetime cap checked only at checkout start; non-lifetime sessions live 24h | src/app/api/kits/checkout/route.ts:30-49; sales.ts:84-91 | Set expires_at on every session; re-check canBuy and the cap in onKitCheckoutCompleted and flag or refund on failure |
| logic-6 | Low | Revoke spends a refresh token before the client_id check; the real client's next refresh then revokes the grant | src/lib/server/kits/oauth-core.ts:377-386 | Look the token up read-only in revoke instead of calling useRefresh |
| logic-7 | Low | Refunding a one-time purchase revokes every upgrade for that account and pack | src/lib/server/kits/sales.ts:125-130 | Limit to upgrades built on the refunded purchase (store a base id) |
| edge-1 | Low | Lost refresh response or concurrent refresh is treated as reuse and revokes the grant | src/lib/server/kits/oauth-core.ts:355-358; store.ts:53-59 | Short grace window after used_at before treating reuse as theft |
| edge-8 | Low | Admin page loads 10 bundles into a 6-entry FIFO cache | src/lib/server/kits/content.ts:23,166,213-222 | Check tags without caching bundles, or LRU / raise MAX_BUNDLES |
| edge-10 | Low | Grants whose refresh tokens expired stay listed as connected apps and are never purged | netlify/functions/purge-deleted.mts:25-26; store.ts:100-105 | In the purge, revoke grants with no live refresh token |
| edge-11 | Low | Audit failure after the grant means the retry skips the purchase email | src/lib/server/kits/sales.ts:84-94 | Catch audit errors (log only), or insert and audit in one transaction |

### sens-1 Account merge deletes the merged account's paid kit entitlements through the new cascade
- Problem: `claimEmail` moves only `subscriptions` and `identities` from the other account, then deletes it. Migration 021 adds `on delete cascade` from `kit_entitlements` (and `oauth_grants`, `oauth_codes`) to `accounts`. Every kit entitlement on the merged account is erased: purchases, staff grants and lifetime licences, along with their Stripe ids. A kit subscription keeps billing in Stripe with no row, so later refund and subscription webhooks find nothing to act on. Reached by any signed-in user through /auth/verify/confirm (route.ts:26-29). Concrete path: staff `grantKit` creates account B for an email via `accountForEmail` (admin/kits/actions.ts:34-35), or the user buys while signed in as B; later, signed in with Apple as A, they claim B's email; B is deleted with its entitlements.
- Evidence: accounts.ts:95-97 `update subscriptions set account_id = ...`; `update identities set account_id = ...`; `delete from accounts where id = ${other.id}`. 021_mcp_oauth.sql:55 `account_id uuid not null references accounts(id) on delete cascade`.
- Fix: before the delete in `claimEmail`, `update kit_entitlements set account_id = ${accountId} where account_id = ${other.id}`, and revoke the other account's `oauth_grants` with an audit row. Change the FK to `on delete restrict` so a missed move fails loudly.
- Verifier: confirmed, Critical. `claimEmail` predates this diff; the cascade that makes it lose paid data is new here.

### sens-2 One IP's anonymous traffic uses up the global MCP cap
- Problem: every POST to /api/mcp increments the shared `mcpTotal` counter (5000/h) before the token is checked and before the anonymous per-IP limit (60/h). Rejected requests still count. One IP sending about 5000 unauthenticated POSTs an hour makes /api/mcp return 429 to every token holder until the window resets.
- Evidence: route.ts:25 `const total = await limited(rules.mcpTotal()); if (total) return tooMany(total);` before the `verifyAccessToken` call and `limited(rules.mcpAnon(ip(req)))` at :31-33. The limiter increments on every call (src/lib/server/db.ts:41-48).
- Fix: run `verifyAccessToken` first (signature check, no database). For a missing or invalid token apply only `mcpAnon(ip)`. Count only requests with a valid signature toward `mcpTotal`.
- Verifier: confirmed, High.

## Checked, no finding
- src/lib/server/kits/oauth-core.ts:118-155: redirect URIs limited to https, loopback http and dotted private schemes; exact match apart from the loopback port; the scheme regex at :133 has no nested quantifier and input is capped at 2000 characters.
- src/lib/server/kits/oauth-core.ts:165-183: registration caps redirect_uris at 5, removes duplicates, strips and caps client_name; client ids are random.
- src/lib/server/kits/oauth-core.ts:225-266: unknown client or redirect shows an error and never redirects; PKCE S256 required; scope and resource checked; codes random, hashed, 5-minute life.
- src/lib/server/kits/oauth-core.ts:325-369: code deleted before any check (single use); client, expiry, exact redirect_uri and PKCE verifier compared in constant time; refresh single use, reuse revokes the grant.
- src/lib/server/kits/oauth-core.ts:281-313, 392-395: access tokens pin algorithm (EdDSA), issuer, audience, typ, kid and expiry; each MCP call re-checks the grant's account, client and revoked state.
- src/lib/server/kits/store.ts:22-29, 37, 51-60, 125-133: atomic code delete-returning; UUID-checked grant ids; refresh used_at flipped once; revokeOwnGrant scoped by account_id and audited; all queries parameterized.
- src/lib/server/kits/server.ts:50-69: body size caps; repeated parameters rejected; signing key never logged.
- src/lib/server/kits/protocol.ts:97-154 and content.ts:237-247: search uses `includes`, not a regex from input; `..` rejected; files read by exact key from an in-memory archive map; access decided on every call, including resources/read.
- src/lib/server/kits/content.ts:28-52, 104-148 and content-core.ts:88, 118-157: repo name validated; tags checked with isRef; downloads limited to GitHub asset URLs and checked against SHA256SUMS; tar reader rejects `..`, links and absolute paths and caps size and entries; token kept out of error text.
- src/lib/server/kits/content-core.ts:191-198 and sales-core.ts:47-85: decide, holding and canBuy handle no entitlements, the all-kits bundle, staff grants, upgrades and lifetime (pack check gap in inj-2).
- src/app/api/mcp/route.ts:36-52: batches rejected; body capped at 64 KB; entitlements read fresh for claims.sub; fixed 3-4 queries per request, no N+1.
- src/app/api/oauth/consent/route.ts:16-43: same-origin, signed-in, impersonation refused, rate limited, authorization re-checked on the server, account from the session.
- src/app/api/oauth/register, token, revoke routes: rate limited, size capped, generic errors.
- src/app/oauth/authorize/page.tsx:39-68 and Consent.tsx:11-30: sign-in before checks; `next` built from a local path; error links only after the redirect URI is verified; framing blocked (src/proxy.ts:27, next.config.ts:8).
- src/app/.well-known/* routes: static metadata from server config, S256 and `none` client auth only.
- src/app/motiv/account/actions.ts:37-45 and KitsSection.tsx:12-83: scoped to account.id; disconnect refused during impersonation; grant id UUID-checked; billing and disconnect hidden in read-only mode; bundle failures caught.
- src/app/admin/kits/actions.ts:13-44 and page.tsx:12-44: admin plus recent sign-in; inputs validated; parameterized; duplicate-grant check with `is not distinct from`; audited (revoke gap in logic-1).
- src/app/api/kits/checkout/route.ts:15-56: salesOpen flag, same-origin, signed-in, rate limited; price from a server lookup key so amount and currency come from Stripe; account and ref in metadata set on the server; lifetime expires_at 35 minutes, in seconds.
- src/app/api/kits/portal/route.ts:16-18: entitlement scoped by account_id.
- src/app/api/stripe/webhook/route.ts:17-72: signature checked before any work; event-id dedupe with rollback on failure; kits and Motiv routed by product metadata on signed events.
- src/lib/server/stripe.ts:167-203: kit handler runs only when no Motiv licence matched; subId passed through for subscription charges; only full refunds act.
- src/lib/server/kits/sales.ts:18-35, 66-95, 110-134: price cache; lifetime count; insert idempotent by the unique checkout-session index; refunds cancel the Stripe subscription before revoking and target only the matching payment intent or subscription.
- src/lib/server/db.ts:36-55: rateLimitCheck parameterized, retry_after at least 1; rateLimit behaviour unchanged; alert keys mask emails.
- src/lib/server/alerts.ts: new event kinds with thresholds and cooldowns; no tokens or emails in keys.
- netlify/database/migrations/021_mcp_oauth.sql: new tables only; hashes as keys; CHECK constraints on pack, through_ref, source and kind (cascade risk in sens-1).
- netlify/database/migrations/022_kit_sales.sql: nullable columns and indexes only; the partial unique index matches the `on conflict ... where` in onKitCheckoutCompleted.
- netlify/functions/purge-deleted.mts:23-30: fixed deletes with no input; used refresh tokens kept until expiry so reuse detection still works (dead-grant gap in edge-10).
- src/content/kits.ts:13-42: display prices only; the charge uses the Stripe price.
- src/app/kits/thanks/page.tsx:8-37: static; ignores session_id.

## Dropped
- No finding was dropped as a false positive.
- Duplicates merged: edge-3 into sens-2 and sens-3; edge-6 into sens-5; sens-6 into inj-1; logic-4 into inj-2; edge-2 into logic-2; edge-7 into logic-3; edge-5, sens-7 and edge-9 into logic-5; edge-12 into logic-6.
- Severity lowered by the verifier: sens-3 High to Medium (connected apps keep working; only new registrations blocked); sens-4 Medium to Low (client ids are random and not widely exposed; effect is an hour of refresh throttling); inj-1 Medium to Low (actor is an admin already impersonating; matches the existing Motiv portal route); edge-1 Medium to Low (strict rotation per OAuth 2.1; cost is a reconnect); edge-8 Medium to Low (lastGood keeps the current bundle; cost is re-reads and memory); edge-5 Medium to Low as part of logic-5 (needs the user to pay twice).

## Not reviewed
- Runtime behaviour: nothing was run. Tests, the dev server and Stripe or GitHub calls were not exercised.
- Stripe Dashboard settings that decide whether sens-5 and logic-3 happen (failed-retry action, enabled payment methods).
- Netlify environment variables, Blobs contents and the GitHub release repo.
- Three lanes (injection, edge cases, and one other) had shell access refused and read the files at head directly from the clean working tree rather than from `git diff`; findings cite head lines.
- CHANGELOG.md, docs/*.md, .env.example, package.json, package-lock.json, LAUNCH/ files.
- src/components/AccountMenu.tsx, src/components/Footer.tsx, src/content/navigation.ts, src/app/page.tsx, src/app/services/page.tsx, src/app/sitemap.ts: link and copy changes, covered only by the general lanes' file lists.
- LAUNCH/changelog.md was not updated, at the owner's request that this commit change only the record.
