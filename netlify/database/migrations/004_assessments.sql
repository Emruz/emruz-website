-- Security self-assessment. Registering (with consent) is required to take it.

-- One registration per account. Holds the consent record.
create table if not exists assessment_registrations (
  account_id       uuid primary key references accounts(id) on delete cascade,
  full_name        text not null,
  company          text not null,
  job_title        text,
  phone            text,
  consent_version  text not null,
  consent_text     text not null,
  consented_at     timestamptz not null default now(),
  consent_ip       text,
  withdrawn_at     timestamptz
);

create table if not exists assessments (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references accounts(id) on delete cascade,
  framework           text not null default 'cis-v8',
  status              text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  step                int not null default 0,
  profile             jsonb not null default '{}',
  answers             jsonb not null default '{}',
  target_ig           int,
  score               int,
  ig1_score           int,
  recommended_package text,
  gaps                jsonb,
  report_emailed      boolean not null default false,
  followed_up_at      timestamptz,
  followed_up_by      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz
);
create index if not exists assessments_account_idx on assessments (account_id, created_at desc);
create index if not exists assessments_status_idx on assessments (status, updated_at desc);
