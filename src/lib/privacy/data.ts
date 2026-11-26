// Privacy controls (#77): what we hold about a person, for export and erasure.
// No Next.js or server-only imports: the purge-deleted function uses eraseSubject too.
// New features that store personal data (the chat bot's logs) add a section with
// registerPrivacySection so export and deletion cover them.
import type postgres from 'postgres';
import { LOG_RETENTION_MONTHS } from './core';

type Sql = ReturnType<typeof postgres>;
type Tx = postgres.TransactionSql;

/** Whose data: the account, when there is one, and every email address tied to it (lowercase). */
export interface Subject {
  accountId: string | null;
  emails: string[];
}

export interface PrivacySection {
  key: string;
  export(sql: Sql, s: Subject): Promise<unknown>;
  /** Delete this section's rows. Runs inside the erase transaction. Returns rows removed. */
  erase(tx: Tx, s: Subject): Promise<number>;
}

const extra: PrivacySection[] = [];

export function registerPrivacySection(section: PrivacySection) {
  if (!extra.some((s) => s.key === section.key)) extra.push(section);
}

/** Marks an account that was erased but kept as an empty shell for purchase records. */
export const ERASED = 'erased';
export const erasedEmail = (accountId: string) => `deleted-${accountId}@deleted.invalid`;

const emailsOf = (s: Subject) => [...new Set(s.emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];

/** The account's default email and every verified email on its sign-in methods. */
export async function subjectForAccount(sql: Sql, accountId: string): Promise<Subject> {
  const rows = await sql<{ email: string }[]>`
    select lower(email) as email from accounts where id = ${accountId}
    union select lower(email) from identities where account_id = ${accountId} and email_verified and email is not null`;
  return { accountId, emails: rows.map((r) => r.email) };
}

/**
 * For a request filed by email: the account that email can sign in to (its default
 * email, or an email-link sign-in), if any. Other providers' emails don't count,
 * since controlling one of those doesn't let you sign in to the account.
 */
export async function subjectForEmail(sql: Sql, email: string): Promise<Subject> {
  const e = email.trim().toLowerCase();
  const [row] = await sql<{ id: string }[]>`
    select id from accounts where lower(email) = ${e} and coalesce(deleted_by, '') <> ${ERASED}
    union select account_id from identities where provider = 'email' and lower(provider_subject) = ${e}
    limit 1`;
  if (!row) return { accountId: null, emails: [e] };
  const s = await subjectForAccount(sql, row.id);
  return { accountId: s.accountId, emails: [...new Set([e, ...s.emails])] };
}

const core: PrivacySection[] = [
  {
    key: 'account',
    export: async (sql, s) =>
      s.accountId
        ? ((await sql`select id, email, name, job_title, phone_mobile, phone_work, company, created_at
             from accounts where id = ${s.accountId}`)[0] ?? null)
        : null,
    erase: async () => 0, // handled last in eraseSubject
  },
  {
    key: 'sign_in_methods',
    export: async (sql, s) =>
      s.accountId ? sql`select provider, email, email_verified, linked_at from identities where account_id = ${s.accountId} order by linked_at` : [],
    erase: async (tx, s) => (s.accountId ? (await tx`delete from identities where account_id = ${s.accountId}`).count : 0),
  },
  {
    key: 'addresses',
    export: async (sql, s) =>
      s.accountId
        ? sql`select label, line1, line2, city, region, postal_code, country, is_default from account_addresses
              where account_id = ${s.accountId} order by position`
        : [],
    erase: async (tx, s) => (s.accountId ? (await tx`delete from account_addresses where account_id = ${s.accountId}`).count : 0),
  },
  {
    key: 'self_assessments',
    export: async (sql, s) =>
      s.accountId
        ? {
            registration: (await sql`select full_name, company, job_title, phone, consent_version, consented_at, withdrawn_at
                from assessment_registrations where account_id = ${s.accountId}`)[0] ?? null,
            assessments: await sql`select id, framework, status, profile, answers, score, recommended_package, created_at, completed_at
                from assessments where account_id = ${s.accountId} order by created_at`,
          }
        : null,
    erase: async (tx, s) =>
      s.accountId
        ? (await tx`delete from assessments where account_id = ${s.accountId}`).count +
          (await tx`delete from assessment_registrations where account_id = ${s.accountId}`).count
        : 0,
  },
  {
    key: 'messages',
    export: async (sql, s) =>
      sql`select name, email, company, topic, message, created_at from contact_messages
          where lower(email) = any(${emailsOf(s)}) order by created_at`,
    erase: async (tx, s) => (await tx`delete from contact_messages where lower(email) = any(${emailsOf(s)})`).count,
  },
  {
    key: 'newsletter',
    export: async (sql, s) =>
      sql`select email, confirmed_at, unsubscribed_at, created_at from newsletter_subscribers where lower(email) = any(${emailsOf(s)})`,
    erase: async (tx, s) => (await tx`delete from newsletter_subscribers where lower(email) = any(${emailsOf(s)})`).count,
  },
  {
    key: 'purchases',
    // Kept after deletion: Stripe and tax records (see the privacy policy)
    export: async (sql, s) => ({
      motiv: await sql`select subscription_id, plan, status, period_end, created_at from subscriptions
          where account_id = ${s.accountId} or lower(customer_email) = any(${emailsOf(s)}) order by created_at`,
      kits: s.accountId
        ? await sql`select pack, source, granted_at, revoked_at from kit_entitlements where account_id = ${s.accountId} order by granted_at`
        : [],
    }),
    erase: async () => 0,
  },
  {
    key: 'connected_apps',
    export: async (sql, s) =>
      s.accountId
        ? sql`select g.client_id, c.client_name, g.scope, g.created_at, g.last_used_at, g.revoked_at
              from oauth_grants g left join oauth_clients c on c.id = g.client_id
              where g.account_id = ${s.accountId} order by g.created_at`
        : [],
    erase: async (tx, s) => (s.accountId ? (await tx`delete from oauth_grants where account_id = ${s.accountId}`).count : 0),
  },
  {
    key: 'activity',
    export: async (sql, s) =>
      s.accountId
        ? sql`select kind, at from events where account_id = ${s.accountId}
              and at > now() - make_interval(months => ${LOG_RETENTION_MONTHS}) order by at`
        : [],
    // Purchase events stay with the purchase record, unlinked from the account
    erase: async (tx, s) => {
      if (!s.accountId) return 0;
      await tx`update events set account_id = null where account_id = ${s.accountId} and subscription_id is not null`;
      return (await tx`delete from events where account_id = ${s.accountId}`).count;
    },
  },
  {
    key: 'privacy_requests',
    // Kept two years as a record of how each request was handled
    export: async (sql, s) =>
      sql`select kind, status, created_at, confirmed_at, completed_at from privacy_requests
          where lower(email) = any(${emailsOf(s)}) or account_id = ${s.accountId} order by created_at`,
    erase: async () => 0,
  },
];

const sections = () => [...core, ...extra];

/** Everything we hold about the subject, as one JSON-ready object. */
export async function exportSubject(sql: Sql, s: Subject): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    note: 'Personal data Emruz holds about you. Purchase records are kept for legal and tax reasons.',
  };
  for (const sec of sections()) out[sec.key] = await sec.export(sql, s);
  return out;
}

export interface EraseResult {
  removed: Record<string, number>;
  /** The account row was kept, emptied, because purchase records refer to it */
  keptShell: boolean;
}

/**
 * Delete everything about the subject except what we must keep (Stripe and kit purchase records).
 * An account with purchases is kept as an empty shell so those records still point somewhere.
 */
export async function eraseSubject(sql: Sql, s: Subject): Promise<EraseResult> {
  const removed: Record<string, number> = {};
  let keptShell = false;
  await sql.begin(async (tx) => {
    for (const sec of sections()) removed[sec.key] = await sec.erase(tx, s);
    await tx`delete from email_tokens where lower(email) = any(${emailsOf(s)})${s.accountId ? tx` or account_id = ${s.accountId}` : tx``}`;
    if (!s.accountId) return;
    const id = s.accountId;
    for (const t of ['sessions', 'pairings', 'staff', 'partner_staff', 'client_contacts'] as const) {
      await tx`delete from ${tx(t)} where account_id = ${id}`;
    }
    const [{ purchases }] = await tx<{ purchases: boolean }[]>`
      select exists(select 1 from kit_entitlements where account_id = ${id})
          or exists(select 1 from subscriptions where account_id = ${id}) as purchases`;
    if (purchases) {
      keptShell = true;
      await tx`update accounts set email = ${erasedEmail(id)}, name = null, job_title = null, phone_mobile = null,
          phone_work = null, company = null, avatar_version = null,
          deleted_at = coalesce(deleted_at, now()), deleted_by = ${ERASED} where id = ${id}`;
    } else {
      await tx`delete from accounts where id = ${id}`;
    }
    removed.account = 1;
  });
  return { removed, keptShell };
}
