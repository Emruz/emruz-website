# PR review: feature/68-pack-access

Commit: 972383eeebcb9f4d9bb8d40e9dde47817b3a93a7
Base: 976c2946311c652e877ee64dfa05bd29554d7423
Date: 2026-11-25
Critical: 0
High: 0
Medium: 3
Low: 10

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 50 code, migration and test files of 55 changed outside LAUNCH/ and the lockfile; lines changed: +3495/-44 (excluding the lockfile and LAUNCH/)
- Skipped: package-lock.json (lockfile), LAUNCH/ (previous review records). Not reviewed by a lane: CHANGELOG.md, docs/emruz-kits-mcp.md, docs/open-items.md, .env.example, package.json (version bump only)
- Diff over 1,500 lines. The logic lane got every changed code, migration and test file. The injection and edge-case lanes got all changed server, route, page and migration files. The sensitive-paths lane got the auth, payments and deletion files and read each in full.
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: partly. No lane was given another lane's results or the previous record, and the verifier got finding text only. However, the sensitive-paths lane read the b580f21 record from the repo on its own and checked its open items, and the logic lane also referred to it (sens-2).
- Sensitive paths touched: auth (OAuth server, MCP endpoint, rate limits), payments (kit checkout, billing portal, Stripe webhook, refunds, delayed payments), data deletion (account merge, purge job, grant revocation, migrations 021 and 023)
- This review replaces the record for b580f21. 972383e changed code after that record (account merge keeps kit purchases, migration 023, MCP limit order, held-release pack check, kits outage fallback, delayed payments, subscription recovery, admin revoke cancels Stripe, checkout errors and impersonation), so the whole branch was reviewed again.

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| edge-1 | Medium | A kit paid after its buyer's account was merged away is never granted; the merge is not in a transaction | src/lib/server/kits/sales.ts:80,94-100; src/lib/server/accounts.ts:95-106; migration 023 | Wrap claimEmail's merge in `db().begin`; in onKitCheckoutCompleted, when client_reference_id has no account, resolve it via accountForEmail(customer email) or a recorded merged_into |
| edge-2 | Medium | Kit subscription status is read from the event payload, so out-of-order events can revoke a paying subscriber | src/lib/server/kits/sales.ts:108-122 | Start onKitSubscriptionChanged with `stripe().subscriptions.retrieve(sub.id)` and branch on the current status |
| logic-1 | Medium | Global MCP cap counted before the per-account limit, so one free account can lock out every user | src/app/api/mcp/route.ts:35-38 | Check rules.mcpSignedIn before rules.mcpTotal |
| inj-1 | Low | Manifest validation allows two items to share a path, so a free item can serve a paid skill's files | src/lib/server/kits/content-core.ts:88 | Reject duplicate paths in validateManifest |
| edge-3 | Low | Refresh token spent before the new pair is stored; a DB error makes the retry look like reuse and revokes the grant | src/lib/server/kits/oauth-core.ts:353-365,315-318 | Use, getGrant and insertRefresh in one transaction, or a short grace window after used_at |
| edge-4 | Low | Admin page loads up to 10 bundles at once into a 6-entry insertion-order cache | src/lib/server/kits/content.ts:23,150-169,220-229; src/app/admin/kits/page.tsx:26 | LRU, never evict lastGood's ref, and don't cache bundles in releaseTags |
| edge-5 | Low | A transient GitHub or Blob error marks a release bad for 10 minutes and sends a false "release rejected" alert | src/lib/server/kits/content.ts:157-164,196-203,231-237 | Add to badRefs and alert only for validation failures; let network errors retry |
| edge-6 | Low | Grants whose refresh tokens expired stay listed as connected apps and are never purged | netlify/functions/purge-deleted.mts:25-26; src/lib/server/kits/store.ts:100-113 | In the purge, revoke grants with no live refresh token, or filter connectedApps to live ones with a limit |
| edge-7 | Low | Eligibility and the lifetime cap are checked only at checkout start; concurrent checkouts can oversell or double-bill | src/app/api/kits/checkout/route.ts:41-42; src/lib/server/kits/sales.ts:94-100 | Re-check canBuy and the cap in onKitCheckoutCompleted and alert staff, or reserve lifetime slots |
| sens-2 | Low | Kit subscription changes ignore the price, so a portal plan switch would keep the original pack | src/lib/server/kits/sales.ts:108-122; src/app/api/kits/portal/route.ts:21-24 | Pass a kit-only portal configuration with plan switching off, or check lookup_key on subscription updates |
| sens-3 | Low | A refund on a subscription already revoked as unpaid doesn't cancel it, and a later payment restores access | src/lib/server/kits/sales.ts:132,110-113 | In revokeKitsForPayment also match revoked_reason = 'subscription unpaid', cancel, and overwrite the reason |
| sens-4 | Low | Revoke spends a refresh token before the client_id check; the real client's next refresh then revokes the grant | src/lib/server/kits/oauth-core.ts:378-383 | Look the token up read-only in revoke instead of calling useRefresh |
| logic-5 | Low | Admin revoke races its own customer.subscription.deleted webhook and loses the admin's reason | src/app/admin/kits/actions.ts:56-68 | Mark revoked with the admin's actor and reason before cancelling in Stripe; clear it if the cancel throws |

### edge-1 A kit paid after its buyer's account was merged away is never granted
- Problem: checkout puts account.id into client_reference_id (checkout/route.ts:61) and onKitCheckoutCompleted inserts it as-is. claimEmail moves kit_entitlements and then deletes the other account in separate statements with no transaction, and migration 023 makes the FK `on delete restrict`. If the webhook for a checkout the merged account started arrives after the delete, the insert fails the FK; the webhook rolls back its event row and returns 500, Stripe retries until it gives up, and the customer is charged with no kit. Delayed payment methods confirm through checkout.session.async_payment_succeeded (webhook/route.ts:39-41) days later, so the window is wide. If it arrives between the move and the delete, the delete fails and leaves a half-merged account.
- Evidence: sales.ts:80 `const accountId = session.client_reference_id;`; :94-98 `insert into kit_entitlements (account_id, ...) values (${accountId}, ...`; accounts.ts:96 `update kit_entitlements set account_id = ${accountId} where account_id = ${other.id}`; :106 `delete from accounts where id = ${other.id}`.
- Fix: run the merge in one `db().begin` transaction; in onKitCheckoutCompleted, when no accounts row has the id, resolve it through accountForEmail(session customer email) (claimEmail adds that email identity to the surviving account) or a merged_into record.
- Verifier: confirmed, Medium. sens-1, logic-2 and logic-6 merged into it.

### edge-2 Out-of-order Stripe events can revoke a paying subscriber
- Problem: onKitSubscriptionChanged branches on the status in the event payload. Stripe doesn't guarantee order and retries failed deliveries later, so a stale `unpaid` processed after `active` revokes access, and nothing restores it until another subscription event.
- Evidence: sales.ts:109 `if (sub.status === 'active' || sub.status === 'trialing') {…}`; :117 `if (!subscriptionEnded(sub.status)) return;` then revoke.
- Fix: retrieve the subscription from Stripe at the start of the handler and branch on its current status.
- Verifier: confirmed, Medium.

### logic-1 Global MCP cap counted before the per-account limit
- Problem: every request with a valid token increments mcpTotal (5000/h) before mcpSignedIn (600/h per account) is checked, and the limiter increments even when it rejects. Free accounts get valid tokens, so one account sending ~5000 requests an hour gets 429 after 600 but keeps filling the global counter until every user is locked out for the window.
- Evidence: route.ts:35-38 `const total = await limited(rules.mcpTotal()); if (total) return tooMany(total); const wait = await limited(rules.mcpSignedIn(claims.sub, claims.client_id));`; db.ts:43-46 upsert on every call.
- Fix: check rules.mcpSignedIn before rules.mcpTotal.
- Verifier: confirmed, Medium.

## Checked, no finding
- src/lib/server/kits/oauth-core.ts:118-155: redirect URIs limited to https, loopback http and dotted private schemes; no fragments or credentials; exact match apart from the loopback port; linear scheme regex.
- src/lib/server/kits/oauth-core.ts:165-198: registration caps redirect_uris at 5, removes duplicates, limits grant and response types, cleans and caps client_name; client ids random, all clients public.
- src/lib/server/kits/oauth-core.ts:225-270: unknown client or redirect gives a page error, never a redirect; PKCE S256 required; scope and resource checked; codes random, hashed, 5-minute life.
- src/lib/server/kits/oauth-core.ts:281-313, 392-395: access tokens pin EdDSA, issuer, audience, typ, kid and expiry; grantActive re-checks account, client and revoked state.
- src/lib/server/kits/oauth-core.ts:325-369: code deleted before any check; client, expiry, exact redirect_uri and PKCE verifier compared in constant time; refresh single use, reuse revokes the grant (gaps in edge-3, sens-4).
- src/lib/server/kits/store.ts:22-60, 68-133: atomic code delete-returning; UUID-checked grant ids; atomic used_at flip; entitlement, connected-app and revokeOwnGrant queries scoped to account_id; all parameterized; revocation audited.
- src/lib/server/kits/server.ts:10-69: signing key loaded lazily and not logged; `*` CORS fine for bearer-only endpoints; 16 KB body cap; repeated parameters refused.
- src/lib/server/kits/limits.ts:33-43: registerPerIp before registerTotal; anonymous MCP traffic hits only the per-IP limit (signed-in ordering in logic-1).
- src/app/api/mcp/route.ts:24-77: batches refused; 64 KB body cap; entitlements read fresh for claims.sub; about 7 small queries per signed request, no N+1.
- src/lib/server/kits/protocol.ts:97-154, 187-200: list and search iterate the in-memory manifest; search uses `includes`, query capped at 200 characters; `..` rejected; access decided per call including resources/read.
- src/lib/server/kits/content.ts:28-52, 104-148, 177-217, 231-256: repo and tags validated; downloads limited to the repo's GitHub asset URLs and checked against SHA256SUMS; token kept out of error text; fallback to lastGood, cached last-good and older releases; held release served only for the same skill name and pack (gaps in edge-4, edge-5).
- src/lib/server/kits/content-core.ts:118-157, 191-198: tar reader rejects `..`, absolute paths and links, caps size and entries; decide handles free, latest-following and held entitlements (path gap in inj-1).
- src/app/api/oauth/consent/route.ts:16-43: same-origin, signed in, impersonation refused, rate limited, authorization re-checked on the server, account from the session.
- src/app/api/oauth/register, token, revoke routes: rate limited, size capped, generic errors.
- src/app/oauth/authorize/page.tsx:39-68 and Consent.tsx:11-30: sign-in before checks; error links only after the redirect URI is verified and only on click; framing blocked (next.config.ts:8, src/proxy.ts:27).
- src/app/.well-known/* routes: static metadata from server config.
- src/app/motiv/account/actions.ts:38-45 and KitsSection.tsx:12-83: scoped to account.id; UUID check; impersonation refused; loads in parallel; bundle failure falls back to null.
- src/app/admin/kits/actions.ts:14-71 and page.tsx:26-47: admin plus recent sign-in; inputs validated; duplicate-grant check with `is not distinct from`; Stripe subscription cancelled before revoke and revoke stops if Stripe refuses; grants list limited to 500; messages rendered as React text (race in logic-5).
- src/app/api/kits/checkout/route.ts:15-68: sales flag, same-origin, signed in, impersonation refused, rate limited, Stripe errors caught; price from a server lookup key so Stripe sets amount and currency; metadata and client_reference_id set on the server; every session expires, at least 30 minutes.
- src/app/api/kits/portal/route.ts:10-30: entitlement scoped to account_id; impersonation refused; errors caught.
- src/app/api/stripe/webhook/route.ts:17-77: signature checked before work; event-id dedupe with rollback on failure; async_payment_succeeded routed to kits only; events routed by product metadata.
- src/lib/server/stripe.ts:167-203: only full refunds and lost disputes act; kit handler only when no Motiv licence matched; subscription id taken from the invoice.
- src/lib/server/kits/sales.ts:76-105, 128-157: unpaid delayed sessions skipped then re-entered on async success; pack, plan and release validated; insert idempotent on the checkout-session index; refunds cancel the Stripe subscription first and scope upgrade revocation to upgrades granted after the refunded purchase.
- src/lib/server/kits/sales-core.ts:47-85: holding, canBuy and lifetimeOpen handle the bundle, staff grants, upgrades and lifetime; bad cap date fails closed.
- src/lib/server/accounts.ts:90-114: claimEmail moves kit entitlements, revokes the merged account's grants and refresh tokens, audits, then deletes; parameterized; reached only from the verified-email claim (gap in edge-1).
- src/lib/server/db.ts:36-55 and alerts.ts: rateLimitCheck parameterized, retry_after at least 1; alert keys hold no tokens or emails.
- src/lib/server/config.ts:33-39: sales flag defaults off; lifetime cap and end date from the server.
- netlify/database/migrations/021_mcp_oauth.sql: new tables; hashes as keys; CHECK constraints on pack, through_ref, source and kind; mcp_audit keeps rows on account delete.
- netlify/database/migrations/022_kit_sales.sql: nullable columns and indexes; partial unique index matches the `on conflict ... where` clause.
- netlify/database/migrations/023_kit_entitlements_keep.sql: dropped constraint name matches Postgres's default for 021's inline FK; `on delete restrict` makes a missed move fail; claimEmail is the only account delete in the repo.
- netlify/functions/purge-deleted.mts:23-30: fixed deletes with no input; used refresh tokens kept until expiry so reuse detection works (gap in edge-6).
- src/app/kits/page.tsx:18-52, 218-219: bundle and lifetime errors caught; notice limited to an allowlist via Object.hasOwn.
- src/app/kits/thanks/page.tsx, src/content/kits.ts: static; display prices only, the charge uses the Stripe price.

## Dropped
- No finding was dropped as a false positive.
- Duplicates merged: sens-1, logic-2 and logic-6 into edge-1; logic-3 into sens-4; logic-4 into edge-7.
- Severity lowered by the verifier: edge-3 Medium to Low (needs a DB failure in a narrow window; the cost is a reconnect); edge-4 Medium to Low (serving uses lastGood directly; cost is re-unpacking and a memory spike on an admin-only page); sens-2 Medium to Low (applies only if plan switching is turned on in the Stripe portal, which is off by default).

## Not reviewed
- Runtime behaviour: nothing was run. Tests, the dev server and Stripe or GitHub calls were not exercised.
- Stripe Dashboard settings that decide whether sens-2 and edge-2 happen (portal plan switching, event delivery order).
- Netlify environment variables, Blobs contents and the GitHub release repo.
- Three lanes (injection and data access, edge cases, sensitive paths) had shell access refused and read files at head directly from the clean working tree rather than from `git diff`. The logic lane and the verifier did not report this. The edge-case lane did not see the diff of src/app/motiv/account/page.tsx and did not read the .well-known routes or Consent.tsx (the other lanes covered them).
- CHANGELOG.md, docs/*.md, .env.example, package.json, package-lock.json, LAUNCH/ files.
- src/components/AccountMenu.tsx, src/components/Footer.tsx, src/content/navigation.ts, src/app/page.tsx, src/app/services/page.tsx, src/app/sitemap.ts: link and copy changes, covered only by the general lanes' file lists.
- LAUNCH/changelog.md was not updated, at the owner's request that this commit change only the record.
