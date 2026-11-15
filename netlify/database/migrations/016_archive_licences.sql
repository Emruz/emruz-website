-- Archive hides a licence that is no longer active from the admin lists; it keeps the record.
alter table subscriptions add column if not exists archived_at timestamptz;
