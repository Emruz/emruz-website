# Repo rules: Emruz/emruz-website

Tier: **Full** (public repo, organization on the Free plan). GitHub can enforce rulesets, required checks, code scanning, secret scanning and push protection.

Run 2026-11-21 by repo-kit (launch-kit release update). Reads ran through the GitHub API; reads the session's API proxy refused are marked "Owner to confirm" with the command.

| Check | Result | Read |
|---|---|---|
| Branch rules on main | Pass | Ruleset 27092501 "main protection", active, no bypass actors: PR required, no force push, no deletion |
| Required checks | Pass | `npm audit and lint`, `Secret scan`, `tests`, `security-scan`, `dependency-review`; every one is produced by security.yml or checks.yml. New jobs to require after their first green run: `codeql (javascript-typescript)`, `codeql (actions)`, `pr-review-record` |
| CODEOWNERS | Fixed | `.github/CODEOWNERS` added: auth, admin, partners, payments and licensing, deletion and uploads, migrations, CI, hooks and ship scripts. Code owner review stays off (solo repo) |
| Secret scanning and push protection | Fail | Both disabled (`security_and_analysis`). Free on public repos |
| Dependabot security updates | Fail | Disabled |
| Dependabot alerts | Owner to confirm | `gh api -i repos/Emruz/emruz-website/vulnerability-alerts` (204 = on); proxy refused |
| Access | Owner to confirm | Owner: push access is just Shahin. Confirm with `gh api repos/Emruz/emruz-website/collaborators --jq '.[] \| select(.permissions.push) \| .login'`, `.../keys`, `.../hooks`; org 2FA needs `gh api orgs/Emruz --jq .two_factor_requirement_enabled` |
| Actions permissions | Owner to confirm | `gh api repos/Emruz/emruz-website/actions/permissions/workflow` (want read, can't approve PRs) |
| Workflow pinning | Pass | All actions pinned to SHAs, `contents: read` at the top of each workflow, no `pull_request_target` |
| Repo settings | Pass | delete_branch_on_merge on, auto-merge off. Forking allowed (public repo) |
| Tokens and backup | Fail | Fine-grained tokens with expiry: yes. No classic `repo` tokens: not confirmed. Backup or mirror: none |

## Fix commands

Security settings (free on this public repo):

```sh
gh api -X PATCH repos/Emruz/emruz-website -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
gh api -X PUT repos/Emruz/emruz-website/vulnerability-alerts
gh api -X PUT repos/Emruz/emruz-website/automated-security-fixes
gh api -X PUT repos/Emruz/emruz-website/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
```

After CodeQL and pr-review-record have each run green once on the launch-audit PR, add them to the ruleset (solo repo: 0 approvals, code owner review off):

```sh
gh api -X PUT repos/Emruz/emruz-website/rulesets/27092501 --input LAUNCH/ruleset-main.json
```

Tokens: revoke any classic token with `repo` scope (github.com/settings/tokens). Backup: mirror the repo somewhere you control, for example a scheduled `git clone --mirror` to a backup disk.

## Upgrade triggers

None apply: public repo (Full tier on Free), one person with push access. Staying on Free is fine.

## Verdict

Enforced on GitHub: PR required on main, no force push or deletion, five required checks. Enforced locally once hooks are on: gitleaks on commit, no pushes to main, no force pushes, the review gate in ship.sh. Open: secret scanning and push protection, Dependabot security updates, tokens and backup, three new checks not yet required.
