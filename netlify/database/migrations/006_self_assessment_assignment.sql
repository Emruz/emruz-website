-- Self-assessments are worked from the assessment workbench: assign one to an analyst.
alter table assessments add column if not exists assigned_to uuid references accounts(id) on delete set null;
create index if not exists assessments_assigned_idx on assessments (assigned_to);
