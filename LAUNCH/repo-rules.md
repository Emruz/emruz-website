# Repo rules: Emruz/emruz-website

Tier: **Full** (public repo). GitHub can enforce rulesets, required checks, code scanning, secret scanning and push protection.

The GitHub API reads were not run from this session (repo not attached, no gh). Rows marked "Owner to confirm" need the read command below.

| Check | Result | Read |
|---|---|---|
| Branch rules on main | Owner to confirm | `gh api repos/Emruz/emruz-website/rulesets` and `gh api repos/Emruz/emruz-website/rules/branches/main` |
| Required checks | Owner to confirm | Same as above. Must list `tests`, `security-scan`, `dependency-review` |
| CODEOWNERS | Fail | No CODEOWNERS file in the repo |
| Security settings | Owner to confirm | `gh api repos/Emruz/emruz-website --jq .security_and_analysis` and `gh api repos/Emruz/emruz-website/vulnerability-alerts -i` (204 = on) |
| Access | Owner to confirm | `gh api repos/Emruz/emruz-website/collaborators --jq '.[] \| select(.permissions.push) \| .login'`, `.../keys`, `.../hooks`, `gh api orgs/Emruz --jq .two_factor_requirement_enabled` |
| Actions permissions | Owner to confirm | `gh api repos/Emruz/emruz-website/actions/permissions/workflow` (want read, can't approve PRs) |
| Workflow pinning | Pass | All actions pinned to SHAs (security.yml fixed in this change) |
| pull_request_target | Pass | Not used |
| Repo settings | Owner to confirm | `gh api repos/Emruz/emruz-website --jq '{delete_branch_on_merge,allow_auto_merge,allow_forking}'` |
| Tokens and backup | Owner to confirm | Fine-grained tokens scoped with expiry; no classic `repo` tokens; a mirror or backup |

## Fix commands

Ruleset on main (solo repo: 0 approvals, code owner review off):

```sh
# New ruleset
gh api -X POST repos/Emruz/emruz-website/rulesets --input LAUNCH/ruleset-main.json
# Or update an existing one
gh api -X PUT repos/Emruz/emruz-website/rulesets/<id> --input LAUNCH/ruleset-main.json
```

Security settings and Actions:

```sh
gh api -X PUT repos/Emruz/emruz-website/vulnerability-alerts
gh api -X PUT repos/Emruz/emruz-website/automated-security-fixes
gh api -X PATCH repos/Emruz/emruz-website -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
gh api -X PUT repos/Emruz/emruz-website/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
```

CODEOWNERS (`.github/CODEOWNERS`), for when a second person gets push access:

```
src/lib/server/        @shahinpirooz
src/app/api/           @shahinpirooz
src/app/workbench/     @shahinpirooz
scripts/               @shahinpirooz
netlify/               @shahinpirooz
.github/               @shahinpirooz
```

## Verdict

Public repo, so nothing needs a plan upgrade. Enforced today: unknown until the reads above run. Enforced locally: ship.sh tests and security scan. Open until the ruleset is applied: direct pushes to main and merges without checks.
