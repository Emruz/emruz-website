#!/usr/bin/env node
// Security finding E1: list accounts whose email was never verified.
// An account is flagged when it has identities but none of them is verified
// for the account email (created from an unverified provider email).
// Accounts with no identities at all come from checkout (Stripe-verified email)
// and are listed separately for review.
// Usage: DATABASE_URL=postgres://... node scripts/unverified-accounts.mjs
import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
if (!url) {
  console.error('Set DATABASE_URL (or NETLIFY_DB_URL).');
  process.exit(1);
}
const sql = postgres(url, { max: 1, onnotice: () => {} });
const admins = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const unverified = await sql`
  select a.id, a.email, a.created_at,
         array_agg(i.provider || ':' || coalesce(i.email, '') || ':' || i.email_verified::text) as identities
  from accounts a join identities i on i.account_id = a.id
  group by a.id
  having not bool_or(i.email_verified and lower(i.email) = lower(a.email))
  order by a.created_at`;
const noIdentity = await sql`
  select a.id, a.email, a.created_at from accounts a
  where not exists (select 1 from identities i where i.account_id = a.id)
  order by a.created_at`;

console.log(`Accounts with no verified identity for their email: ${unverified.length}`);
for (const r of unverified) {
  const flag = admins.includes(r.email.toLowerCase()) ? '  <-- ADMIN_EMAILS match' : '';
  console.log(`  ${r.id}  ${r.email}  ${r.created_at.toISOString()}  [${r.identities.join(', ')}]${flag}`);
}
console.log(`\nAccounts with no sign-in identity (checkout only): ${noIdentity.length}`);
for (const r of noIdentity) console.log(`  ${r.id}  ${r.email}  ${r.created_at.toISOString()}`);
await sql.end();
