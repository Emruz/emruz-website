-- Assessment workbench: assessor-led NIST CSF 2.0 assessments, evidence,
-- draft reports with review, client portal.

-- Emruz staff who can use the workbench (admins always can).
create table if not exists staff (
  account_id  uuid primary key references accounts(id) on delete cascade,
  role        text not null default 'assessor' check (role in ('assessor', 'lead')),
  added_by    text,
  added_at    timestamptz not null default now()
);

create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  website     text,
  industry    text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Client people who can use the portal
create table if not exists client_contacts (
  client_id   uuid not null references clients(id) on delete cascade,
  account_id  uuid not null references accounts(id) on delete cascade,
  title       text,
  is_primary  boolean not null default false,
  added_at    timestamptz not null default now(),
  primary key (client_id, account_id)
);

create table if not exists engagements (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id) on delete cascade,
  title               text not null,
  status              text not null default 'intake'
                        check (status in ('intake', 'fieldwork', 'review', 'delivered', 'closed')),
  lead_account_id     uuid references accounts(id) on delete set null,
  target_ig           int not null default 2 check (target_ig between 1 and 3),
  intake              jsonb not null default '{}',
  summary             text not null default '',
  self_assessment_id  uuid references assessments(id) on delete set null,
  start_date          date,
  due_date            date,
  created_by          uuid references accounts(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists engagements_client_idx on engagements (client_id);
create index if not exists engagements_status_idx on engagements (status, updated_at desc);

-- One row per rated CSF subcategory
create table if not exists engagement_ratings (
  engagement_id   uuid not null references engagements(id) on delete cascade,
  subcategory     text not null,
  current_level   int check (current_level between 0 and 5),
  target_level    int check (target_level between 0 and 5),
  na              boolean not null default false,
  na_reason       text,
  notes           text,
  recommendation  text,
  override_reason text,
  prefilled       boolean not null default false,
  updated_by      uuid references accounts(id) on delete set null,
  updated_at      timestamptz not null default now(),
  primary key (engagement_id, subcategory)
);

create table if not exists evidence_requests (
  id             uuid primary key default gen_random_uuid(),
  engagement_id  uuid not null references engagements(id) on delete cascade,
  subcategory    text,
  text           text not null,
  status         text not null default 'open' check (status in ('open', 'received', 'closed')),
  created_by     uuid references accounts(id) on delete set null,
  created_at     timestamptz not null default now(),
  closed_at      timestamptz
);
create index if not exists evidence_requests_eng_idx on evidence_requests (engagement_id, status);

create table if not exists evidence (
  id             uuid primary key default gen_random_uuid(),
  engagement_id  uuid not null references engagements(id) on delete cascade,
  kind           text not null check (kind in ('file', 'link')),
  title          text not null,
  url            text,
  blob_key       text,
  filename       text,
  content_type   text,
  size_bytes     bigint,
  from_client    boolean not null default false,
  request_id     uuid references evidence_requests(id) on delete set null,
  uploaded_by    uuid references accounts(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists evidence_eng_idx on evidence (engagement_id, created_at desc);

create table if not exists evidence_links (
  evidence_id  uuid not null references evidence(id) on delete cascade,
  subcategory  text not null,
  primary key (evidence_id, subcategory)
);

-- Report versions. content is a frozen snapshot of everything the report shows.
create table if not exists reports (
  id             uuid primary key default gen_random_uuid(),
  engagement_id  uuid not null references engagements(id) on delete cascade,
  version        int not null,
  status         text not null default 'draft'
                   check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'sent')),
  content        jsonb not null,
  created_by     uuid references accounts(id) on delete set null,
  created_at     timestamptz not null default now(),
  submitted_at   timestamptz,
  reviewed_by    uuid references accounts(id) on delete set null,
  reviewed_at    timestamptz,
  review_note    text,
  sent_at        timestamptz,
  sent_to        text[],
  unique (engagement_id, version)
);

create table if not exists engagement_events (
  id             bigserial primary key,
  engagement_id  uuid not null references engagements(id) on delete cascade,
  actor          text,
  kind           text not null,
  detail         jsonb not null default '{}',
  created_at     timestamptz not null default now()
);
create index if not exists engagement_events_idx on engagement_events (engagement_id, created_at desc);
