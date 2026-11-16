-- Partner multi-tenancy.
--
-- A partner is an organization whose staff run guided self-assessments for
-- the end-customers they bring. Partner admins manage their own staff.
-- Emruz staff see everything; partner staff see only their tenant.
-- Full engagements stay Emruz-only for now; engagements.partner_id is added
-- so they can be tenant-scoped later without another migration.

create table if not exists partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  notify_email  text,
  logo_version  bigint,
  active        boolean not null default true,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One tenant per person; being Emruz staff and partner staff at once is refused in code.
create table if not exists partner_staff (
  account_id  uuid primary key references accounts (id) on delete cascade,
  partner_id  uuid not null references partners (id) on delete cascade,
  is_admin    boolean not null default false,
  active      boolean not null default true,
  added_by    text,
  added_at    timestamptz not null default now()
);
create index if not exists partner_staff_partner_idx on partner_staff (partner_id);

alter table assessments add column if not exists partner_id uuid references partners (id) on delete set null;
create index if not exists assessments_partner_idx on assessments (partner_id) where partner_id is not null;

-- Which partner brought this registered customer; new assessments inherit it.
alter table assessment_registrations add column if not exists partner_id uuid references partners (id) on delete set null;

-- Unused until engagements open up to partners.
alter table engagements add column if not exists partner_id uuid references partners (id) on delete set null;
