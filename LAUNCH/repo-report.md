# Repo report: Emruz/emruz-website

Run 2026-11-21 by repo-kit (from launch-kit, release update, fix mode) on branch `launch-audit`.

- Visibility: public. Owner: organization (Emruz). Plan: Free.
- Tier: **Full**. A public repo gets rulesets, required checks, code scanning, secret scanning and push protection on any plan.

## Skills

| Skill | Run | Pass | Fixed | Fail | Not on plan | Owner to confirm |
|---|---|---|---|---|---|---|
| repo-rules-audit | Run | 4 | 1 | 3 | 0 | 3 |
| repo-ci-checks | Run | 4 | 7 (CodeQL this run, 6 on 2026-11-22 UTC) | 0 | 0 | 0 |
| repo-pr-review | Install mode: gate, hooks and record Action installed and proved in a throwaway clone. Hooks not yet on in your checkout | | | | | |

Details: LAUNCH/repo-rules.md, LAUNCH/repo-ci.md, LAUNCH/security-scan.md (passed).

## Where each control is enforced

| Control | On GitHub | Locally | Status |
|---|---|---|---|
| PR required on default branch | Yes | Yes (pre-push hook, ship gate) | Enforced (GitHub) |
| Force push and deletion blocked | Yes | Yes (pre-push hook) | Enforced (GitHub) |
| Security scan | Yes (required) | Yes (ship.sh) | Enforced (GitHub) |
| Tests | Yes (required) | Yes (ship.sh) | Enforced (GitHub) |
| Secret scanning and push protection | No (settings off) | Yes (gitleaks in scan, CI and pre-commit) | Open |
| Dependency review | Yes (required) | Yes (npm audit in scan) | Enforced (GitHub) |
| Code scanning (CodeQL) | No (workflow added, not yet required) | Yes (Semgrep in scan) | Open |
| PR review record | No (Action added, not yet required) | Yes (ship gate) | Local only |
| CODEOWNERS on sensitive paths | No (file added; review off, solo repo) | n/a | Local only |

## Upgrade verdict

Stay on Free. The repo is public, so the plan already gives the Full tier.

## Owner commands, in order

1. GitHub settings:
   ```sh
   gh api -X PATCH repos/Emruz/emruz-website -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
   gh api -X PUT repos/Emruz/emruz-website/vulnerability-alerts
   gh api -X PUT repos/Emruz/emruz-website/automated-security-fixes
   gh api -X PUT repos/Emruz/emruz-website/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
   ```
   Then run the three "Owner to confirm" reads in LAUNCH/repo-rules.md.
2. Files: ship `launch-audit` (CODEOWNERS, codeql.yml, pr-review-record.yml, ship gate, hooks). Before shipping, run the PR review on the branch and commit its record, or the new gate stops the ship.
3. After CodeQL and pr-review-record run green once: `gh api -X PUT repos/Emruz/emruz-website/rulesets/27092501 --input LAUNCH/ruleset-main.json`
4. Local: `scripts/install-hooks.sh` in your checkout (needs `brew install gitleaks`). Revoke any classic `repo` token; set up a mirror backup.

Rollback is now a revert on a branch plus a PR. The hook blocks direct pushes to main.
