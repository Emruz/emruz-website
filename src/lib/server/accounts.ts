import 'server-only';
import { db, logEvent } from './db';

export interface IdentityClaims {
  provider: 'microsoft' | 'google' | 'apple' | 'email';
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name?: string | null;
}

export type SignInResult = { ok: true; accountId: string } | { ok: false; error: string };

const lower = (e: string | null) => (e ? e.trim().toLowerCase() : null);

/**
 * Resolve a sign-in to an account. Order:
 * 1. a known identity signs in to its account
 * 2. when linking from a signed-in session, attach to that account
 * 3. a verified email that matches an account links to it
 * 4. otherwise create a new account
 */
export async function signInWithIdentity(c: IdentityClaims, linkToAccountId?: string | null): Promise<SignInResult> {
  const email = lower(c.email);
  const [known] = await db()<{ account_id: string }[]>`
    select account_id from identities where provider = ${c.provider} and provider_subject = ${c.subject}`;

  if (known) {
    if (linkToAccountId && known.account_id !== linkToAccountId) {
      return { ok: false, error: 'That sign-in is already linked to a different Emruz account.' };
    }
    await db()`update identities set email = ${email}, email_verified = ${c.emailVerified}
               where provider = ${c.provider} and provider_subject = ${c.subject}`;
    await attachPurchases(known.account_id);
    return { ok: true, accountId: known.account_id };
  }

  let accountId = linkToAccountId ?? null;
  if (!accountId && email && c.emailVerified) {
    const [byEmail] = await db()<{ id: string }[]>`select id from accounts where lower(email) = ${email}`;
    accountId = byEmail?.id ?? null;
  }
  if (!accountId) {
    if (!email) return { ok: false, error: 'Your sign-in provider did not share an email address.' };
    // Never create an account from an email the provider has not verified:
    // that would let someone pre-register an address they do not own.
    if (!c.emailVerified) {
      return {
        ok: false,
        error: 'Your sign-in provider did not confirm this email address. Sign in with an email link first, then link this sign-in method from your account page.',
      };
    }
    const [taken] = await db()<{ id: string }[]>`select id from accounts where lower(email) = ${email}`;
    if (taken) {
      return {
        ok: false,
        error: 'An account with this email already exists. Sign in with an email link first, then link this sign-in method from your account page.',
      };
    }
    const [created] = await db()<{ id: string }[]>`
      insert into accounts (email, name) values (${email}, ${c.name ?? null}) returning id`;
    accountId = created.id;
    await logEvent('account_created', { provider: c.provider }, { accountId });
  }

  await db()`
    insert into identities (account_id, provider, provider_subject, email, email_verified)
    values (${accountId}, ${c.provider}, ${c.subject}, ${email}, ${c.emailVerified})`;
  await logEvent('identity_linked', { provider: c.provider }, { accountId });
  await attachPurchases(accountId);
  return { ok: true, accountId };
}

/** Attach unclaimed purchases made with any verified email on this account. */
export async function attachPurchases(accountId: string) {
  await db()`
    update subscriptions set account_id = ${accountId}
    where account_id is null and lower(customer_email) in (
      select lower(email) from accounts where id = ${accountId}
      union
      select lower(email) from identities where account_id = ${accountId} and email_verified and email is not null
    )`;
}

/**
 * Claim a purchase email into the signed-in account (used when Apple's
 * "Hide My Email" address doesn't match the checkout email). The email has
 * been verified by a sign-in link sent to it.
 */
export async function claimEmail(accountId: string, emailInput: string) {
  const email = lower(emailInput)!;
  const [other] = await db()<{ id: string }[]>`select id from accounts where lower(email) = ${email} and id <> ${accountId}`;
  if (other) {
    // Move the other account's purchases and sign-ins here
    await db()`update subscriptions set account_id = ${accountId} where account_id = ${other.id}`;
    await db()`update identities set account_id = ${accountId} where account_id = ${other.id}`;
    await db()`delete from accounts where id = ${other.id}`;
  }
  await db()`
    insert into identities (account_id, provider, provider_subject, email, email_verified)
    values (${accountId}, 'email', ${email}, ${email}, true)
    on conflict (provider, provider_subject) do update set account_id = ${accountId}`;
  await db()`update subscriptions set account_id = ${accountId} where account_id is null and lower(customer_email) = ${email}`;
  await logEvent('email_claimed', { email }, { accountId });
}

/** Account for a checkout email, created if needed (purchases made while signed out). */
export async function accountForEmail(emailInput: string, name?: string | null): Promise<string> {
  const email = lower(emailInput)!;
  const [found] = await db()<{ id: string }[]>`
    select a.id from accounts a where lower(a.email) = ${email}
    union
    select i.account_id from identities i where lower(i.email) = ${email} and i.email_verified
    limit 1`;
  if (found) return found.id;
  const [created] = await db()<{ id: string }[]>`
    insert into accounts (email, name) values (${email}, ${name ?? null})
    on conflict ((lower(email))) do update set email = accounts.email
    returning id`;
  return created.id;
}

/**
 * Make a verified address the account's main email. Refused when another account
 * already uses it; the old address stays as a sign-in method.
 */
export async function changeEmail(accountId: string, emailInput: string): Promise<'done' | 'taken'> {
  const email = lower(emailInput)!;
  const [other] = await db()`
    select 1 from accounts where lower(email) = ${email} and id <> ${accountId}
    union all
    select 1 from identities where lower(email) = ${email} and account_id <> ${accountId}
    limit 1`;
  if (other) return 'taken';
  await db()`
    insert into identities (account_id, provider, provider_subject, email, email_verified)
    values (${accountId}, 'email', ${email}, ${email}, true)
    on conflict (provider, provider_subject) do nothing`;
  await db()`update accounts set email = ${email} where id = ${accountId}`;
  await logEvent('email_changed', { email }, { accountId });
  return 'done';
}
