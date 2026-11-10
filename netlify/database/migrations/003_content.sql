-- Insights articles, managed at /admin/insights
create table if not exists insights (
  slug text primary key,
  title text not null,
  excerpt text not null default '',
  category text not null default '',
  body text not null default '',
  related_label text,
  related_href text,
  published boolean not null default false,
  published_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists insights_published_idx on insights (published, published_on desc);

-- Newsletter sign-ups (double opt-in)
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  token text not null unique,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Messages from the contact form
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  topic text,
  message text not null,
  ip text,
  emailed boolean not null default false,
  created_at timestamptz not null default now()
);

-- The first six articles
insert into insights (slug, title, excerpt, category, body, related_label, related_href, published, published_on) values
('nist-csf-guide', 'NIST Cybersecurity Framework: A Practical Guide', 'Understanding NIST CSF 2.0, how it applies to your organization, and why framework-based thinking matters for compliance and strategy.', 'Frameworks', 'The NIST Cybersecurity Framework (CSF) is the most widely used way to describe a security program in plain business terms. It is not a checklist and it is not a certification. It is a shared vocabulary that lets security teams, executives, auditors and boards talk about the same thing.

Version 2.0 widened the framework from critical infrastructure to every kind of organization and added a sixth function, Govern, which puts leadership accountability at the center.

## The six functions

- Govern: strategy, roles, policy and oversight of cybersecurity risk.
- Identify: know your assets, data, suppliers and risks.
- Protect: safeguards such as identity, training, data security and platform hardening.
- Detect: find attacks and anomalies quickly.
- Respond: contain, analyze and communicate during an incident.
- Recover: restore operations and learn from what happened.

## Profiles and tiers

The practical value of CSF comes from profiles. A current profile describes where you are today. A target profile describes where you need to be, based on your risk, obligations and budget. The gap between the two becomes your roadmap.

Implementation tiers (Partial, Risk Informed, Repeatable, Adaptive) describe how mature and consistent your practices are. Not every organization needs to be Adaptive. The right tier is the one that matches your risk.

## How to get started

- Scope it: pick the business units, systems and data that matter most.
- Assess honestly: score current outcomes against the CSF subcategories, with evidence.
- Set a target: decide the outcomes you need in the next 12 to 24 months.
- Prioritize: rank gaps by risk reduction per dollar, not by how easy they are.
- Report: use the six functions as the structure for board and executive updates.

## Why it matters beyond compliance

CSF maps cleanly to CIS Controls, ISO 27001 and CMMC, so one well run program can support several obligations at once. More importantly, it turns security from a list of tools into a set of measurable outcomes that leadership can fund and track.', 'GRC Program', '/services/grc', true, date '2026-11-09'),
('cloud-security-architecture', 'Cloud Security Architecture: Design Principles That Matter', 'Five design principles that should guide your cloud security strategy, from zero trust to compliance-first thinking.', 'Cloud', 'Most cloud breaches are not caused by sophisticated attacks. They come from misconfiguration, excessive permissions and exposed credentials. Good architecture prevents these by design instead of relying on people to get every setting right.

## 1. Identity is the perimeter

In the cloud, every action is an API call made by an identity. Enforce phishing-resistant MFA, remove standing admin access, use short-lived credentials and grant least privilege by default. Review unused permissions regularly and remove them.

## 2. Assume breach and segment

Zero trust means no implicit trust based on network location. Separate workloads into accounts or subscriptions by environment and sensitivity, keep production isolated, and make every connection between them explicit and logged.

## 3. Guardrails over gates

Teams move fast in the cloud. Instead of manual reviews that slow them down, apply preventive guardrails such as organization policies and service control policies, and use infrastructure as code so secure defaults are built in from the first deployment.

## 4. Protect the data, not just the platform

Know where sensitive data lives, encrypt it with keys you control where it matters, and watch for data moving to places it should not. Data security posture management makes this continuous rather than a one-time inventory.

## 5. Build compliance in

Map your controls to the frameworks you answer to before you build, and collect evidence automatically through logging and posture monitoring. Audits become a report you run, not a scramble.

## Cost and security go together

The same discipline that secures a cloud estate also controls its cost: clear ownership, tagging, standard building blocks and removing what is not used. Treat them as one program.', 'Cloud Strategy & Security', '/services/cloud', true, date '2026-11-08'),
('vciso-program-guide', 'Building a vCISO Program: When and How', 'When organizations need fractional CISO leadership, how to structure it for success, and what to measure.', 'Leadership', 'A virtual CISO (vCISO) gives you experienced security leadership without a full-time executive hire. Done well, it brings strategy, accountability and board-level communication to a program that has been running on good intentions.

## Signs you need one

- Customers, insurers or auditors are asking questions nobody can answer with confidence.
- Security is owned by IT on top of everything else.
- You are pursuing a framework such as SOC 2, ISO 27001 or CMMC.
- The board wants regular, meaningful security reporting.
- You have tools, but no plan tying them to business risk.

## How to structure it

Start with a short assessment against a recognized framework so everyone agrees on the baseline. Then set a 12-month roadmap, a regular operating rhythm and clear decision rights.

- Weekly or biweekly working sessions with IT and security staff.
- Monthly risk review with the executive sponsor.
- Quarterly board or leadership reporting.
- Defined ownership of policy, risk acceptance and incident escalation.

## What to measure

- Progress against the roadmap and target framework profile.
- Time to detect and respond to incidents.
- Coverage: assets managed, MFA adoption, critical patch timeliness.
- Risk register trends: risks closed, accepted and newly found.
- Audit and customer questionnaire outcomes.

## When to hire full time

A vCISO is often the right step for years. When security becomes a daily executive function, with a large team and constant decisions, a good vCISO will help you define the role, hire for it and hand over cleanly.', 'vCISO & Leadership', '/services/vciso', true, date '2026-11-07'),
('ai-governance-framework', 'AI Governance: The Framework Every Organization Needs', 'AI brings real opportunity and real risk. What practical AI governance looks like, and how to start without slowing teams down.', 'AI', 'Your people are already using AI, whether or not there is a policy. Governance is not about stopping that. It is about making sure AI is used where it helps, with data it is allowed to see, and with someone accountable for the outcome.

## Frameworks worth knowing

- NIST AI Risk Management Framework: Govern, Map, Measure and Manage AI risks.
- ISO/IEC 42001: a certifiable management system for AI.
- The EU AI Act: risk-based obligations for organizations that build or use AI in the EU.

## A practical starting point

- Inventory: list the AI tools and features in use, including those built into existing software.
- Classify data: decide what data can go to which tools, and enforce it.
- Approve tools: offer good, sanctioned options so people do not need shadow AI.
- Assign owners: every AI use case that affects customers or decisions has an accountable owner.
- Review risk: assess higher-risk uses for accuracy, bias, privacy and security before launch.
- Train people: short, practical guidance on what is allowed and how to check AI output.

## Security risks specific to AI

AI introduces new attack paths: prompt injection, data leakage through prompts and outputs, over-permissioned agents and poisoned data. Treat AI agents like any other identity, with least privilege, logging and review.

## Governance that enables

The best AI governance is light where risk is low and rigorous where it is high. Clear rules let teams adopt AI faster, because they know what is allowed.', 'AI Advisory & Enablement', '/services/ai', true, date '2026-11-06'),
('assessment-to-roadmap', 'From Assessment to Roadmap: Making Diagnostic Work Useful', 'How to turn security assessments into actionable roadmaps that actually move the needle.', 'Strategy', 'Too many assessments end as a long report that nobody acts on. The value of an assessment is not the findings. It is the decisions and the plan that follow.

## Start with the decision

Before assessing anything, agree on what the results will be used for: a budget request, a compliance target, an insurance renewal or a board update. That determines the scope, the framework and the level of detail.

## Score outcomes, not tools

Owning a product is not the same as being protected. Score whether an outcome is achieved, with evidence, against a framework such as NIST CSF or CIS Controls. That gives you a baseline you can measure progress against.

## Turn findings into a roadmap

- Group findings into initiatives instead of hundreds of separate tasks.
- Rank each initiative by risk reduced, effort and cost.
- Separate quick wins (30 to 90 days) from foundational work (6 to 18 months).
- Give every initiative an owner, a budget range and a measurable result.
- Show the target state, so leadership knows what done looks like.

## Keep it alive

Review the roadmap monthly, re-score key areas every six to twelve months, and report progress in the same structure each time. Consistency is what builds trust with executives and the board.', 'Assessments', '/assessments', true, date '2026-11-05'),
('soc-design-enterprise', 'Security Operations at Scale: SOC Design for Enterprise', 'Designing security operations that scale without breaking: architecture, tooling and team structure.', 'Operations', 'A security operations center (SOC) exists to find and stop attacks before they become incidents. At enterprise scale the challenge is not collecting more alerts. It is turning a flood of data into a small number of correct, timely actions.

## Architecture

- Collect telemetry where attacks happen: endpoints, identity, email, cloud, network and SaaS.
- Centralize it in a SIEM or XDR platform with normalized, searchable data.
- Correlate across sources so one attack shows up as one case, not fifty alerts.
- Automate enrichment and routine response, such as isolating a device or disabling an account.

## Detection engineering

Map detections to MITRE ATT&CK so you know what you cover and what you do not. Tune continuously: every false positive costs analyst time, and alert fatigue is how real attacks get missed.

## People and process

- Tiered or pod-based teams with clear escalation paths.
- Runbooks for the most common and most damaging scenarios.
- Proactive threat hunting, not only alert handling.
- 24x7 coverage, since attackers often strike nights and weekends.
- Regular exercises with IT, legal and leadership.

## Measure what matters

- Mean time to detect and mean time to respond.
- Detection coverage against priority techniques.
- True positive rate and alert volume per analyst.
- Exposure trends from continuous testing and posture management.

## Build, buy or blend

Running a 24x7 SOC in-house is expensive and hard to staff. Many organizations blend an internal team that owns context and decisions with a managed service that provides round-the-clock monitoring, response and threat hunting.', 'Managed security', '/products/compare', true, date '2026-11-04')
on conflict (slug) do nothing;
