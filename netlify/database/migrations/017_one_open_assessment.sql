-- One open self-assessment per account.
--
-- The /assessments/self page created a draft row while rendering, and a Next.js
-- prefetch plus the real navigation could both insert one. The extra draft was
-- never used and sat in the workbench list as "In progress, 0% answered".

-- Stale empty drafts left behind beside a completed assessment.
delete from assessments d
where d.status = 'in_progress' and d.deleted_at is null
  and d.answers = '{}'::jsonb
  and exists (
    select 1 from assessments c
    where c.account_id = d.account_id and c.status = 'completed'
      and c.deleted_at is null and c.completed_at > d.updated_at);

-- Several open drafts for one account: keep the one most recently worked on.
delete from assessments a
using assessments b
where a.account_id = b.account_id and a.id <> b.id
  and a.status = 'in_progress' and a.deleted_at is null
  and b.status = 'in_progress' and b.deleted_at is null
  and (b.updated_at > a.updated_at or (b.updated_at = a.updated_at and b.id > a.id));

-- At most one open assessment per account from now on.
create unique index if not exists assessments_one_open
  on assessments (account_id) where status = 'in_progress' and deleted_at is null;

-- When the sales notice for a started assessment was sent.
alter table assessments add column if not exists started_notice_at timestamptz;

-- Anything that already has activity does not get a late "started" notice.
update assessments set started_notice_at = coalesce(completed_at, updated_at)
where started_notice_at is null and (status = 'completed' or answers <> '{}'::jsonb);
