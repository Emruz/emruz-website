# PR review: feature/77-privacy-controls

Commit: 8a885b3464dce384a756b857669397feff451d37
Base: cf755b6dbfb26556e8653863e742f152fc43f589
Date: 2026-11-26
Critical: 0
High: 1
Medium: 2
Low: 20

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 43 code files (src/, netlify/, tests/); lines changed: +2055/-133 (excluding skipped files)
- The branch is not merged with main (origin/main is at cf755b6), so the diff carries #76 (621a5bb, ba2bdb3, 5f8ae10) and #77 (8a885b3, migration 030).
- Skipped: package-lock.json (lockfile), LAUNCH/. Not reviewed by a lane: CHANGELOG.md, docs/site-settings.md, package.json (version bump 202611.9.0 to 202611.10.0 only)
- Diff over 1,500 lines. Logic and edge-case lanes were split into area A (#76: site settings, kits, workbench, self-assessment) and area B (#77: privacy controls, cookie consent, export, requests, erasure, purge, migration 030). The injection lane got every changed code file. The sensitive-paths lane read the auth, payments and deletion files in full.
- Lanes: logic (A, B), injection and data access, edge cases and performance (A, B), sensitive paths. Isolated: yes (separate read-only agents on a clean checkout of the head commit; no lane saw another's results or a previous record; the verifier got finding text only). No tests were run.
- Sensitive paths touched: auth (session.ts erased-account check, account delete and export, admin privacy actions and export route, public privacy request and confirm, cookie consent action, admin kits and settings actions, workbench self-assessment pick and guidedOn), payments (admin kit revoke and undo, refund and dispute revocation in kits/sales.ts, Stripe prices from site settings), data deletion (eraseSubject and eraseForRequest, purge-deleted.mts events and privacy_requests retention, migration 030, dropLegacyDraft, deleteEvidence and ERL link removal with request reopening)

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| sens-1 | High | Approved erasure keeps a shell account but never cancels its Stripe subscriptions; renewals keep charging a customer who can no longer sign in | src/lib/privacy/data.ts:194-201; src/lib/server/privacy.ts:162-172; src/app/admin/privacy/actions.ts:39-53 | Cancel every active Motiv and kit subscription before eraseSubject and refuse to erase if a cancel fails, or block erase until they are cancelled |
| logicB-1 | Medium | Export and erasure skip assessment_invites, mcp_audit and devices, yet the requester is told their data was deleted | src/lib/privacy/data.ts:60-159; src/app/admin/privacy/actions.ts:49-51 | Add sections that export and delete or unlink these rows (devices may stay with kept purchase records as policy) |
| edgeB-1 | Medium | confirmRequest uses up the token, then runs unguarded steps; a failure leaves the request open with no due date and the user cannot retry | src/lib/server/privacy.ts:84-108; src/app/privacy/request/actions.ts:24-27 | Set due_at in the first UPDATE; wrap the account link, log and alert steps in a logging try/catch |
| sens-3 | Low | Concurrent decline and erase: data erased while the request is recorded as rejected | src/lib/server/privacy.ts:162-172; src/app/admin/privacy/actions.ts:39-53 | Claim the request with a conditional UPDATE ... RETURNING inside the erase transaction |
| sens-4 | Low | Kept-shell erasure leaves view-as sessions by the erased account and unexpired oauth_codes, which can mint a new kits grant | src/lib/privacy/data.ts:191-193; src/lib/server/session.ts:85-87 | Also delete sessions where impersonated_by = id and oauth_codes where account_id = id |
| logicB-6 | Low | "Complete and notify" on a delete request says it was completed without erasing anything | src/app/admin/privacy/page.tsx:76-83; src/app/admin/privacy/actions.ts:29-35 | Force outcome 'rejected' for delete requests in complete(), or hide that button for them |
| logicB-5 | Low | Daily purge deletes privacy_* admin audit events after 13 months while requests are kept 730 days | netlify/functions/purge-deleted.mts:34-35 | Exempt privacy_% kinds, or purge them on the 730-day rule |
| logicB-4 | Low | subjectForEmail picks an arbitrary account when one email matches two | src/lib/privacy/data.ts:51-54 | Order by the accounts.email match first, or surface the ambiguity to the admin |
| logicB-2 | Low | Confirm page shows the due date in UTC; email and admin queue use Los Angeles time | src/app/privacy/request/actions.ts:26; src/app/privacy/request/confirm/page.tsx:13-15 | Format in America/Los_Angeles in both places |
| edgeB-2 | Low | Export and erase filter events by account_id, which has no index | src/lib/privacy/data.ts:141-148; netlify/database/migrations/001_motiv.sql:106 | New migration: index on events (account_id, at desc) where account_id is not null |
| edgeB-3 | Low | Privacy and delete requests are not deduplicated; unconfirmed ones don't count as pending | src/app/account/delete/actions.ts:13-36; src/app/account/delete/page.tsx:20-21 | Skip or reuse an existing unconfirmed/open request of the same kind |
| edgeB-4 | Low | Avatar deleted before the erase transaction; a rollback leaves a broken avatar and an unhandled error | src/lib/server/privacy.ts:168-169; src/app/admin/privacy/actions.ts:43 | Delete the avatar after eraseSubject succeeds |
| edgeB-6 | Low | Unbatched events delete runs before the privacy_requests purge; a failure skips the 7-day purge of unconfirmed requests | netlify/functions/purge-deleted.mts:34-38 | Run the privacy_requests deletes first, or isolate each step; batch the events delete |
| edgeB-7 | Low | confirmRequest sends the receipt and each admin alert one after another on the request path | src/lib/server/privacy.ts:97-108 | Promise.allSettled |
| logicA-1 | Low | Refund revocation can lose the race with the subscription-deleted webhook; refund reason and audit lost, false payment_reversed_review | src/lib/server/kits/sales.ts:175-186 | Also match revoked_by='stripe' and revoked_reason like 'subscription %', or update before cancelling |
| logicA-2 | Low | createEngagement inserts client and contact link before selfForEngagement throws | src/app/workbench/actions.ts:235-243,260 | Resolve the self-assessment right after staff(), before inserts |
| edgeA-2 | Low | A stale self-assessment pick throws to the generic error page instead of redirecting with ?error= | src/app/workbench/actions.ts:219-225,260 | Return null or redirect to /workbench/new?error=self |
| logicA-3 | Low | ERL request scope narrows to confirmed categories once one prefilled rating is confirmed | src/content/frameworks.ts:362-363; src/app/workbench/actions.ts:583-584 | Count prefilled ratings for ERL scope; keep the strict filter for staffHours |
| logicA-4 | Low | An invalid Netlify variable is shown as "replaced by a value saved here" with nothing saved | src/app/admin/settings/page.tsx:61-63,82-83; src/lib/server/settings-core.ts:166-170 | Put only 'saved' or 'cleared' sources in `ignored`; label 'default' as invalid in Netlify |
| logicA-6 | Low | Netlify-prefilled values count as changes on every save, so a legacy price or a transient Stripe/GitHub error blocks unrelated saves | src/app/admin/settings/page.tsx:96; src/app/admin/settings/actions.ts:88-99 | Skip external checks for values equal to the effective Netlify value, or say the value came from Netlify |
| logicA-5 | Low | checkRef treats a release still loading as checked | src/lib/server/kits/content.ts:238 | Await the cached promise instead of bundles.has |
| edgeA-3 | Low | checkRef doesn't share in-flight downloads, so concurrent admin renders fetch the same release twice | src/lib/server/kits/content.ts:237-249,259 | Map of in-flight checks keyed by ref |
| edgeA-1 | Low | Mixed-version deploy race between dropLegacyDraft and the insert can return null or take over a legacy draft | src/lib/server/assessments.ts:101-113,308-315 | Retry once after dropLegacyDraft; guard the guided do-update with framework |

### sens-1 Erasure keeps billing
- Problem: When the account has a Motiv subscription or kit entitlement, eraseSubject keeps it as an emptied shell (identities and sessions deleted, email rewritten, deleted_at set). Nothing cancels the Stripe subscriptions on subscriptions or kit_entitlements. Renewals continue; the customer cannot sign in (session.ts:87) or reach the billing portal, and attachPurchases only claims rows with account_id null, so a new account with the same email doesn't see them.
- Evidence: data.ts:194-196 `exists(select 1 from kit_entitlements ...) or exists(select 1 from subscriptions ...) as purchases`; data.ts:199-201 `update accounts set email = ${erasedEmail(id)} ... deleted_by = ${ERASED}`; privacy.ts:162-172 has no Stripe call.
- Fix: In eraseForRequest, cancel each non-cancelled stripe_subscription_id (as revokeKit does) before erasing; refuse to erase if any cancel fails. Or list active subscriptions on the request and block erase until they are cancelled.
- Verifier: confirmed. Kit subscribers are worst off: oauth_grants are deleted (data.ts:135) so /api/kits/portal is unreachable.

### logicB-1 Export and erasure miss tables
- Problem: exportSubject and eraseSubject cover account, sign-in methods, addresses, self-assessments, messages, newsletter, purchases, connected apps, activity and privacy requests. They don't touch assessment_invites (email, full_name, company), mcp_audit (ip, account_id, kept 365 days and still linked to the shell) or devices (device_name). The admin then sends "We deleted your personal data."
- Evidence: migration 019:10-24; migration 021:69-78; data.ts:60-159 section list; admin/privacy/actions.ts:49-51.
- Fix: Add an invites section (export and delete where lower(email) = any(emails) or account_id = id); export and delete or unlink mcp_audit rows; decide whether devices stay with kept purchase records and say so in the notice.
- Verifier: confirmed (sens-2 merged). devices is the weakest of the three, since subscriptions are kept on purpose.

### edgeB-1 Request confirmation not atomic
- Problem: The first UPDATE commits status 'open' and clears the token. subjectForEmail, the second UPDATE (due_at, account_id), logEvent and siteSettings() then run with no error handling, and the confirm action has no try/catch. A failure shows the user an error page, the link then says "expired or already used", and the request sits at the bottom of the admin queue with no due date shown.
- Evidence: privacy.ts:86-90, 93-95, 102; request/actions.ts:25; listRequests `order by due_at asc nulls last` (privacy.ts:133); admin/privacy/page.tsx:36.
- Fix: Set due_at in the first UPDATE from the california flag; wrap the follow-up steps in a try/catch that logs.
- Verifier: confirmed (logicB-3 merged).

### Low findings
Each Low is in the table above with its location and fix; the verifier confirmed each against the code. edgeB-2 and logicA-1 were lowered from Medium: the export is rate-limited and erasure is rare (edgeB-2); the webhook race needs a narrow window and access is revoked either way (logicA-1).

## Checked, no finding
- src/lib/server/session.ts:87: `a.deleted_at is null` blocks sessions for erased shell accounts; lookup is by primary key, no hot-path cost.
- src/app/account/export/route.ts:8-25: sign-in, impersonation refused, step-up, rate limit (10/hour), scoped to the caller's own account, no-store.
- src/app/account/delete/actions.ts:13-37: sign-in, impersonation refused, step-up, explicit confirm; email and account id from the session; nothing deleted until an admin approves.
- src/app/admin/privacy/actions.ts:10-21: every action checks isAdmin (false while impersonating) and recent sign-in; ids validated as UUIDs.
- src/app/admin/privacy/[id]/export/route.ts:8-25: admin plus step-up, open access requests only, export logged with the admin as actor.
- src/app/admin/privacy/page.tsx: requester input rendered as escaped React text; mailto link email limited to one @.
- src/app/privacy/request/actions.ts and src/lib/server/privacy.ts:61-75: parseRequest validates kind and lengths; rate limits per IP and per email; token stored hashed, single use, 7-day expiry; requester text never put into an email.
- src/app/privacy/request/confirm/page.tsx:34-37: confirmation is a POST, so link scanners can't confirm.
- src/app/privacy/request/page.tsx:20-21: error text only from a whitelist; no reflected query text.
- src/app/cookies/actions.ts and src/lib/privacy/core.ts:36-51: only sets the caller's own httpOnly consent cookie to fixed values; GPC always wins over opt-in; malformed or old cookie shows the banner.
- src/lib/server/privacy.ts:147-159: closeRequest only moves open or in-progress requests, so no double notice.
- src/lib/privacy/data.ts:183-208: erasure in one transaction; deletes filtered by account_id or the subject's emails; table names in tx(t) come from a constant list; the kit_entitlements on-delete-restrict FK (migration 023) is handled by the shell branch.
- netlify/functions/purge-deleted.mts:33-38: retention intervals are bound constants; licence events (subscription_id set) and admin settings audit kept.
- netlify/database/migrations/030_privacy_requests.sql: additive only (if not exists); status and kind checks match core.ts; account_id on delete set null.
- src/app/admin/kits/actions.ts:62-96: admin plus step-up; undo matches the exact revoked_at, actor and reason, and re-checks Stripe before undoing.
- src/lib/server/kits/sales.ts:165-202: conditional update leaves rows revoked meanwhile alone; return is rows actually ended; the one caller only tests > 0.
- src/app/admin/settings/actions.ts:42-110 and src/lib/server/settings-core.ts:117-196: admin plus step-up; prices must be USD, not kits prices, right plan type, one product; amounts come from Stripe; Object.hasOwn guards lookups; cleared prices give null (checkout off).
- src/lib/server/settings.ts:38-92: generation guard stops a pre-save read from caching; failed read keeps last values and retries after 5s.
- src/app/workbench/actions.ts:219-226: selfForEngagement applies the same visibility rule as selfOn before answers are copied (closes the earlier cross-staff copy).
- src/app/workbench/actions.ts:424-437, 457-465, 478-507: evidence add, unlink and delete each run in one transaction scoped to the engagement; reopenUnanswered touches only that engagement's requests and skips hand-closed ones.
- src/app/workbench/actions.ts:900-906: guidedOn adds the framework filter; role and partner checks unchanged.
- src/lib/server/workbench.ts:187-205: getRequests replaces a per-request subquery with one CTE (removes an N+1); union dedupes evidence counted two ways.
- src/lib/server/assessments.ts:68-125: framework filters bound; dropLegacyDraft limited to the account's in-progress non-csf-2.0 drafts; framework column is not null.
- src/app/workbench/new/page.tsx:20-26: picker keeps limit 200 and matches the selfForEngagement filter.
- src/components/assessment/RequestGroup.tsx:30-46 and ReportDocument.tsx:111: render-only changes, no empty-list issue.

## Dropped
- None. Duplicates merged: sens-2 into logicB-1, logicB-3 into edgeB-1, inj-1 into sens-4, edgeB-5 into logicB-4, edgeA-4 into logicA-6, and the pending-promise part of edgeA-3 into logicA-5.

## Not reviewed
- Runtime behaviour: no tests, build or app run during this review.
- Database row counts (events table size for edgeB-2 and edgeB-6) and the Netlify function time limit.
- Stripe account configuration, Netlify environment variables, email provider behaviour.
- CHANGELOG.md, docs/site-settings.md, package.json version bump, package-lock.json.
