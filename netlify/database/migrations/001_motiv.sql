-- Motiv licensing and emruz.com member accounts.
-- Applied automatically by Netlify Database on deploy. Never edit after it has
-- been applied; add a new numbered file instead.

create table if not exists accounts (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text,
  created_at    timestamptz not null default now()
);
create unique index if not exists accounts_email_idx on accounts (lower(email));

-- Sign-in methods linked to an account (microsoft, google, apple, email)
create table if not exists identities (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references accounts(id) on delete cascade,
  provider         text not null,
  provider_subject text not null,
  email            text,
  email_verified   boolean not null default false,
  linked_at        timestamptz not null default now(),
  unique (provider, provider_subject)
);
create index if not exists identities_account_idx on identities (account_id);

create table if not exists sessions (
  token_hash  text primary key,
  account_id  uuid not null references accounts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

-- Email sign-in links. purpose: 'signin' or 'claim' (claim a purchase email
-- into the signed-in account).
create table if not exists email_tokens (
  token_hash  text primary key,
  email       text not null,
  purpose     text not null,
  account_id  uuid references accounts(id) on delete cascade,
  return_to   text,
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create table if not exists subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  subscription_id          text not null unique,          -- MOTIV-XXXX-XXXX-XXXX-XXXX
  account_id               uuid references accounts(id) on delete set null,
  customer_email           text not null,
  plan                     text not null check (plan in ('monthly','annual','lifetime')),
  status                   text not null check (status in ('active','past_due','canceled','revoked')),
  period_end               timestamptz,                   -- null for lifetime
  cancel_at_period_end     boolean not null default false,
  past_due_since           timestamptz,
  seats                    int not null default 2,
  complimentary            boolean not null default false,
  stripe_customer_id       text,
  stripe_subscription_id   text unique,
  stripe_payment_intent_id text unique,
  stripe_checkout_session  text unique,
  revoked_at               timestamptz,
  revoke_reason            text,
  created_at               timestamptz not null default now()
);
create index if not exists subscriptions_account_idx on subscriptions (account_id);
create index if not exists subscriptions_email_idx on subscriptions (lower(customer_email));

create table if not exists devices (
  subscription_id  uuid not null references subscriptions(id) on delete cascade,
  device_id        text not null,
  device_name      text,
  os               text,
  app_version      text,
  first_seen       timestamptz not null default now(),
  last_checkin     timestamptz,
  deactivated_at   timestamptz,
  primary key (subscription_id, device_id)
);

-- Pairing codes (OAuth 2.0 device authorization grant)
create table if not exists pairings (
  device_code_hash text primary key,
  user_code        text not null,
  device_id        text not null,
  device_name      text,
  os               text,
  app_version      text,
  status           text not null default 'pending' check (status in ('pending','approved','denied')),
  account_id       uuid references accounts(id) on delete cascade,
  subscription_id  uuid references subscriptions(id) on delete cascade,
  expires_at       timestamptz not null,
  last_polled_at   timestamptz,
  created_at       timestamptz not null default now()
);
create unique index if not exists pairings_pending_code_idx on pairings (user_code) where status = 'pending';

create table if not exists events (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  kind        text not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  account_id  uuid references accounts(id) on delete set null,
  actor       text,
  detail      jsonb
);
create index if not exists events_sub_idx on events (subscription_id, at desc);

create table if not exists stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

create table if not exists rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  count        int not null
);
