# Lifetime licence fix

Decision (owner, 2026-11-14): a Lifetime purchase is a **never-expiring licence**. It is not revoked except for misuse under the EULA, and any revocation happens only while Motiv is still supported. Plan name stays "Lifetime". When Emruz ends support, Lifetime Premium keeps working and receives no further updates or security fixes.

## Current behaviour (verified in `launch-audit`)

| Item | Where | Current behaviour |
|---|---|---|
| Lease length | `src/lib/server/config.ts:21` | Every lease, including Lifetime, expires 14 days after issue (`MOTIV_LEASE_DAYS`). The app renews it at each daily check-in. |
| Lifetime end date | `src/lib/server/licensing.ts:97-107`, `migrations/001_motiv.sql:52` | `period_end` is null for Lifetime, so no end date is set. The lease is still rolling. |
| Offline use | Terms, "Computers and check-in" | If the app cannot reach emruz.com, Premium pauses after the lease expires (about 14 days). |
| Refund | `src/app/api/stripe/webhook/route.ts:47-49` | `charge.refunded` revokes Lifetime access automatically. |
| Chargeback | `webhook/route.ts:52` | `charge.dispute.closed` revokes access. |
| Admin revoke | `src/app/admin/motiv/actions.ts` | Admins can revoke any plan. |
| Terms wording | `src/app/terms/page.tsx:98` | "A lifetime plan includes Premium for as long as Emruz offers Motiv" |

Two things need to change: the lease must not expire for Lifetime, and revocation must be limited to EULA misuse.

## Proposed design

### 1. Lease (this repo, server side)

- For a Lifetime subscription, issue a lease with `lease_expires` set to a far-future date (e.g. `2099-12-31T23:59:59Z`) and add `perpetual: true` to the signed payload. Keep the signature and key ID unchanged.
- Continue to issue a fresh lease at each check-in, so a revocation can still reach a connected app.
- A held Lifetime lease keeps working offline. Missing check-ins never pause a perpetual lease.
- Backward compatible: an app that still reads `lease_expires` sees a valid date, so this server change can ship before the app change.

### 2. Revocation (this repo, server side)

- Allowed reasons for a Lifetime revocation: **EULA misuse** (seat sharing, bypassing licence checks, serious breach). Admin action only, with a logged reason.
- Revocation takes effect when the app next checks in successfully. Offline, the perpetual lease stays valid until a check-in happens.
- Revocation is not available after support ends. A `MOTIV_SUPPORT_ENDS` date (environment variable) controls this. After that date, check-ins still return the lease, but the server does not revoke Lifetime licences.
- **Open decision:** refunds and chargebacks. The terms say a refund ends Premium. Keep automatic revocation for a refund within the refund window, or treat refunds as a separate case? A chargeback is a payment reversal, not EULA misuse, so it conflicts with "only for misuse" unless it is handled as a contract termination. Owner decides; counsel should check (lawyer question 5).

### 3. Desktop app (separate repo, "app chat")

- Treat a lease with `perpetual: true` as valid regardless of `lease_expires`, and never pause Premium for a missing check-in.
- Keep checking in when online. If the server returns `revoked`, stop Premium on the next successful check-in.
- Do not require a network connection to run Premium for a perpetual lease.
- Keep the existing 14-day behaviour for monthly and annual leases.

### 4. Site copy (this repo, `launch-audit`)

- Pricing page, Lifetime note: "One payment. Premium never expires and keeps working after support ends. Updates and support while Emruz offers Motiv." (`src/app/motiv/page.tsx:18`)
- Terms, Lifetime section: describe the licence as perpetual. State the notice period before support ends, that no updates or security fixes follow, and that revocation is for EULA misuse only, while support is running. (`src/app/terms/page.tsx`, "Lifetime plan" and "Suspension and revocation")
- Notice period: **[12] months** (owner to confirm).

## Order of work

1. Owner confirms: notice period, and the refund and chargeback decision.
2. Server change in this repo (lease and revocation rules). Low risk, backward compatible.
3. Site copy on `launch-audit`, merged with the other legal fixes.
4. App change in the desktop repo, done after the site is finished.

## Risks

- **Revocation is weaker.** A perpetual licence held offline cannot be revoked until the app checks in. This is the trade-off for a licence that never expires.
- **Security fixes after support ends.** The terms say there are none. For an app that records meetings, counsel should review whether that is acceptable (lawyer question 6).
- **Testing.** The lease and revocation rules need tests in `tests/` before shipping. Existing test vectors (`tests/motiv-test-vectors.json`) will need new Lifetime vectors.

## Prompt for the app chat

> Motiv Lifetime licences are changing. Please update the desktop app so that a lease with `perpetual: true` is treated as valid regardless of `lease_expires`, and so that a missing or failed check-in never pauses Premium for a perpetual lease. Keep checking in when the network is available. If the server returns `revoked`, stop Premium on the next successful check-in. Do not change behaviour for monthly or annual leases, which keep the 14-day lease. Add tests for: a perpetual lease offline past 14 days still works; a revoked response turns Premium off at the next successful check-in; a monthly lease still pauses after its lease expires. Do not ship until the server sends `perpetual: true` on Lifetime leases (server change is in the website repo, `src/lib/server/licensing.ts`).
