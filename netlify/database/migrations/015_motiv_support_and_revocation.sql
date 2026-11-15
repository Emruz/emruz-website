-- Motiv support dates (stored here, not in environment variables) and revocation category.

create table if not exists motiv_support (
  id               int primary key default 1 check (id = 1),  -- single row
  notice_given_at  timestamptz,      -- when buyers were told support will end
  support_ends_at  timestamptz,      -- null = supported, no end date set
  updated_at       timestamptz not null default now(),
  updated_by       text
);

insert into motiv_support (id) values (1) on conflict (id) do nothing;

alter table subscriptions
  add column if not exists revoke_category text
    check (revoke_category in ('refund', 'chargeback', 'eula_misuse', 'admin_error'));
