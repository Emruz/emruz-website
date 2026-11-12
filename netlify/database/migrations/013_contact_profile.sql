-- Contact details on the profile, used to start engagements from a contact
alter table accounts add column if not exists phone_mobile text;
alter table accounts add column if not exists phone_work text;
alter table accounts add column if not exists company text;

create table if not exists account_addresses (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references accounts(id) on delete cascade,
  label        text,
  line1        text not null,
  line2        text,
  city         text,
  region       text,
  postal_code  text,
  country      text,
  is_default   boolean not null default false,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists account_addresses_account_idx on account_addresses (account_id, position);
