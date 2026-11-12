-- Guided self-assessments: an Emruz staff member completes it on the customer's behalf.
alter table assessments add column if not exists performed_by uuid references accounts(id) on delete set null;
