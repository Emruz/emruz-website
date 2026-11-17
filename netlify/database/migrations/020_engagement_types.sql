-- Engagement kind and, for assessments, the assessment type (one per card on /assessments).
-- Existing engagements are NIST CSF security assessments.
alter table engagements add column if not exists kind text not null default 'assessment'
  check (kind in ('assessment'));
alter table engagements add column if not exists assessment_type text not null default 'security'
  check (assessment_type in ('security', 'vciso', 'compliance', 'cloud', 'data', 'ai'));
create index if not exists engagements_type_idx on engagements (kind, assessment_type);
