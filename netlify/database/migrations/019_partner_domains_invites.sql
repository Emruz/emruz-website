-- Partner email domains and self-assessment invites.

-- Only people with an address on one of these domains can join the partner's
-- staff, e.g. {dataendure.com, gocmt.com}. Stored lower-case, without "@".
alter table partners add column if not exists email_domains text[] not null default '{}';

-- A partner (or Emruz, partner_id null) invites someone to take the
-- self-assessment themselves. When that person registers with the invited
-- email, their registration and assessments belong to the partner.
create table if not exists assessment_invites (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid references partners (id) on delete cascade,
  email        text not null,
  full_name    text,
  company      text,
  invited_by   uuid references accounts (id) on delete set null,
  invited_by_email text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz not null default now(),
  accepted_at  timestamptz,
  account_id   uuid references accounts (id) on delete set null,
  revoked_at   timestamptz
);

-- One open invite per email address.
create unique index if not exists assessment_invites_open_email
  on assessment_invites (lower(email)) where accepted_at is null and revoked_at is null;
create index if not exists assessment_invites_partner_idx on assessment_invites (partner_id, created_at desc);
