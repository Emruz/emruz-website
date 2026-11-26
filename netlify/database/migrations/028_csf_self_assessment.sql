-- Self-assessment rebuilt on NIST CSF 2.0 (#72). Earlier self-assessments used
-- the old question set (framework 'cis-v8') and were pre-launch test data, so
-- they are deleted; engagements that were pre-filled from one keep their
-- ratings and lose only the link (on delete set null). New rows are written
-- with framework 'csf-2.0' by the app, so the column default is left alone and
-- the previous deploy still runs on this schema.
delete from assessments where framework = 'cis-v8';

-- Published insights: drop mentions of the old control set.
update insights set body = replace(body, 'CSF maps cleanly to CIS Controls, ISO 27001 and CMMC', 'CSF maps cleanly to ISO 27001, SOC 2 and CMMC')
  where body like '%CSF maps cleanly to CIS Controls, ISO 27001 and CMMC%';
update insights set body = replace(body, 'against a framework such as NIST CSF or CIS Controls', 'against a framework such as NIST CSF')
  where body like '%against a framework such as NIST CSF or CIS Controls%';
