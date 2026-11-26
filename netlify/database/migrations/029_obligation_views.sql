-- Obligation views (#73): HIPAA, NIST SP 800-171, ISO 27001 Annex A and an
-- insurer checklist on reports, with evidence from the SCF Evidence Request List.
-- Additive only, so the previous deploy still runs on this schema.

-- Obligations chosen for an engagement (hipaa, nist171, iso27001, soc2, insurance).
alter table engagements add column if not exists obligations text[] not null default '{}';

-- SCF Evidence Request List item (e.g. E-IAC-05) a request was raised from.
alter table evidence_requests add column if not exists erl_id text;
create unique index if not exists evidence_requests_erl_idx on evidence_requests (engagement_id, erl_id) where erl_id is not null;

-- Evidence linked to ERL items, so one upload covers every requirement that item supports.
create table if not exists evidence_erl_links (
  evidence_id  uuid not null references evidence(id) on delete cascade,
  erl_id       text not null,
  primary key (evidence_id, erl_id)
);

-- Credentials shown in the assessor block of reports (e.g. CISSP, CISA).
alter table staff add column if not exists credentials text;

-- Assessor status for an obligation requirement, overriding the status derived
-- from CSF ratings (used where the SCF has no CSF mapping, or to correct one).
create table if not exists obligation_ratings (
  engagement_id  uuid not null references engagements(id) on delete cascade,
  obligation     text not null check (obligation in ('hipaa', 'nist171', 'iso27001', 'soc2', 'insurance')),
  requirement    text not null,
  status         text not null check (status in ('met', 'partial', 'not_met', 'unknown')),
  note           text,
  updated_by     uuid references accounts(id) on delete set null,
  updated_at     timestamptz not null default now(),
  primary key (engagement_id, obligation, requirement)
);
