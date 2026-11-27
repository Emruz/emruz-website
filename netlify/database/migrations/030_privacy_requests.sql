-- Privacy controls (#77): privacy requests, reviewed by an admin in /admin/privacy.
-- Additive only, so the previous deploy still runs on this schema.

-- Set when an approved deletion empties an account that must stay for purchase
-- records (deleted_by = 'erased'). Such an account can't hold a session.
alter table accounts add column if not exists deleted_at timestamptz;
alter table accounts add column if not exists deleted_by text;
create index if not exists accounts_deleted_idx on accounts (deleted_at) where deleted_at is not null;

-- Access, correct, delete and opt-out requests, from the public form or the account page.
-- Nothing is deleted or changed until an admin approves the request.
create table if not exists privacy_requests (
  id                  uuid primary key default gen_random_uuid(),
  kind                text not null check (kind in ('access', 'correct', 'delete', 'opt_out')),
  source              text not null default 'form' check (source in ('form', 'account')),
  email               text not null,
  name                text,
  details             text,
  california          boolean not null default false,
  status              text not null default 'unconfirmed'
                        check (status in ('unconfirmed', 'open', 'in_progress', 'completed', 'rejected')),
  confirm_token_hash  text unique,
  confirmed_at        timestamptz,
  due_at              timestamptz,
  account_id          uuid references accounts(id) on delete set null,
  resolution          text,
  completed_at        timestamptz,
  completed_by        text,
  ip                  text,
  created_at          timestamptz not null default now()
);
create index if not exists privacy_requests_status_idx on privacy_requests (status, due_at);
create index if not exists privacy_requests_email_idx on privacy_requests (lower(email));
