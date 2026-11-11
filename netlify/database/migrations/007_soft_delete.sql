-- Assessments and engagements marked for deletion are purged 30 days later,
-- by the purge-deleted scheduled function. Until then they can be restored.
alter table assessments add column if not exists deleted_at timestamptz;
alter table assessments add column if not exists deleted_by text;
alter table engagements add column if not exists deleted_at timestamptz;
alter table engagements add column if not exists deleted_by text;
create index if not exists assessments_deleted_idx on assessments (deleted_at) where deleted_at is not null;
create index if not exists engagements_deleted_idx on engagements (deleted_at) where deleted_at is not null;
