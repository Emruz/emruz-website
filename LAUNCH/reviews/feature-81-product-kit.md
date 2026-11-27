# PR review: feature/81-product-kit

Commit: ed56a1592eedca3fee1473a14528671f728085f4
Base: 0dacee16810a1e7ef7ed091f580f3ce8f06920f7
Date: 2026-11-26
Critical: 0
High: 0
Medium: 0
Low: 2

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 10 (src/app/kits/page.tsx, src/content/kits.ts, public/kits/{all,founder,marketing,product,release}.svg, tests/kits-content.test.mts, tests/kits-launch.test.mts, tests/kits-sales.test.mts); lines changed: +211/-32 across all 14 files
- Skipped: package-lock.json (lockfile), LAUNCH/. Not reviewed by a lane: CHANGELOG.md, docs/emruz-kits-mcp.md (text only), package.json (version bump 202611.10.0 to 202611.11.0 only)
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes (separate read-only agents; no lane saw another's results or a previous record; the verifier got finding text only). No tests were run.
- Sensitive paths touched: payments (src/content/kits.ts adds the `product` pack and its display prices, and the bundle now names it). No auth or data deletion hunks. Data access: src/app/kits/page.tsx (HTML output, logo img src).

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| logic-1 | Low | The Product Kit card shows Buy buttons even when the live release manifest has no `product` pack or the Stripe `kits_product_*` prices are missing; buyers only find out after submitting | src/content/kits.ts:35-41; src/app/kits/page.tsx:227, 332 | Publish the emruz-kits release with `product` and create the Stripe prices before this deploys; to guard in code, filter the cards by `sellablePacks(manifest.packs)` |
| logic-2 | Low | One-time bundle owners at a release older than the Product Kit see "Your bundle covers this kit up to that release" on the Product card | src/app/kits/page.tsx:196-198; src/lib/server/kits/sales-core.ts:51-57 | Don't show the "covers" sentence for a pack that isn't in the held release; suggest the bundle upgrade instead |

### logic-1 Product Kit offered before it is sellable
- Problem: `/kits` draws one card per `kitOffers` entry and never checks the live manifest. Checkout does check it: `canBuy` returns `unknown_pack` when the pack isn't in `manifest.packs`. If the served release has no `product` pack, Buy ends in "That kit is not on sale."; if the Stripe price is missing, it ends in "That option is not available right now." Someone who owns every other kit also still gets the purchase-trigger question (`canBuyAny`). Nothing is charged or granted.
- Evidence: page.tsx:227 `const addOns = kitOffers.filter((o) => o !== lead && o !== bundle);`; sales-core.ts:74 `if (!sellablePacks(manifestPacks).includes(pack)) return { ok: false, reason: 'unknown_pack' };`; checkout/route.ts:46, 49.
- Fix: Release order first: the emruz-kits release listing `product` and the Stripe `kits_product_{once,upgrade,month,year}` prices go live before this site release. Code guard (optional): return `manifest.packs` from `loadState` and hide or disable offers not in `sellablePacks(...)`.
- Verifier: confirmed, Low. edge-1 merged into it as a duplicate. The page gap existed before for every add-on; this diff makes it reachable with the first pack that may be missing from the served release.

### logic-2 Misleading "bundle covers this kit" for old bundle holders
- Problem: `holding('product', ...)` counts an `all` entitlement. For a one-time bundle held at an older release it returns `{ state: 'held', upgradable: false }`, and the card prints "You have release X. Your bundle covers this kit up to that release." That release had no Product Kit skills. Over MCP, `decide()` allows the pack at ref X, so list_skills marks the Product skills available, then get_skill says they aren't in release X.
- Evidence: sales-core.ts:51 `ents.filter((e) => e.pack === pack || e.pack === 'all')`, :57 `return { state: 'held', ref: best(covering), upgradable: false };`; page.tsx:196-198.
- Fix: In OfferCard, when the held release predates the pack, show "Upgrade your bundle to get this kit." in place of the "covers" sentence.
- Verifier: confirmed, Low (copy only; checkout still allows once, month and year at sales-core.ts:82-84). edge-2 merged into it as a duplicate.

## Checked, no finding
- public/kits/*.svg: all five read in full; only rect, circle, path, g, linearGradient; no script, event handlers, foreignObject, external href or metadata; served through `<img>`.
- src/app/kits/page.tsx:73-79 (`logoFor`, `PackLogo`): the path comes from the fixed `kitOffers` list, so user input can't reach it; every pack has its logo file (the launch test checks this).
- src/app/kits/page.tsx:248-273 (overview band): `latest` and names are escaped JSX; the badge is hidden when `latest` is null; `[lead, ...addOns]` is null-filtered.
- src/app/kits/page.tsx:228, 294-299 (Free to start): `leadCount?.free` falls back to generic copy when the bundle load fails or nothing is free.
- src/app/kits/page.tsx:144, 212-223, 338 (`wide`/`split`): layout only; defaults to false; ownership still comes from `holding(o.pack, ents, latest)`; the lifetime row is still limited to the bundle.
- src/content/kits.ts:35-46 (payments): display only. The charge is the Stripe price found by lookup key (checkout/route.ts:53-56); `canBuy` runs on manifest packs before the price lookup (route.ts:44-49); a missing price returns the buyer with a notice and no session; lifetime is still bundle-only (sales-core.ts:75-76); the bundle covers `product` by the `all` wildcard in `decide`, `holding` and `canBuy` (content-core.ts:196-202, sales-core.ts:51); the bundle is still cheaper than the four kits on every plan.
- src/lib/server/kits/sales.ts:80-115, 129-145: webhook validation, idempotency and plan switches between packs are unchanged; Marketing and Product cost the same, so a switch between them is no cheaper route.
- N+1 and unbounded work: no new database, Stripe or network calls; loops cover at most 5 in-memory offers.
- tests/kits-*.test.mts: assertions match sales-core and content-core behaviour; logo checks read files without running them.

## Dropped
- edge-1: duplicate of logic-1.
- edge-2: duplicate of logic-2.

## Not reviewed
- Whether the live emruz-kits release lists `product` in its manifest, and whether the Stripe `kits_product_*` prices exist with amounts matching src/content/kits.ts (sandbox and live).
- Visual layout of /kits at each breakpoint (no browser check).
- Test run: the lanes read the tests but did not run them.
- CHANGELOG.md, docs/emruz-kits-mcp.md and package.json (text and version only), package-lock.json.
