-- Job title on the profile
alter table accounts add column if not exists job_title text;
