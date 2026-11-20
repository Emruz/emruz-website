#!/usr/bin/env bash
# Open (or update) a pull request so Netlify builds a deploy preview. Does not merge.
#   npm run preview -- "Title of the change"
#   npm run preview -- "Title" --branch feature/my-change   (when starting on main)
#   npm run preview -- "Title" --issue 42                     (link an issue; usually found automatically)
#   npm run preview -- "Title" --no-issue                     (no issue, don't ask)
#   npm run pr -- "Title"                                    (same thing)
#
# Steps: commit any changes, check (types, lint, build), push, open or reuse the
# pull request, print the preview address. Run `npm run ship` later to merge.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31mError: %s\033[0m\n' "$1" >&2; exit 1; }
# shellcheck source=scripts/issue.sh
source "scripts/issue.sh"

TITLE=""
BRANCH_ARG=""
ISSUE_ARG=""
SKIP_BUILD=0
STRIPE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --branch) BRANCH_ARG="${2:-}"; shift 2 ;;
    --issue) ISSUE_ARG="${2:-}"; shift 2 ;;
    --no-issue) ISSUE_ARG="none"; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --stripe) STRIPE=1; shift ;;
    -*) fail "Unknown option $1" ;;
    *) TITLE="$1"; shift ;;
  esac
done

command -v gh >/dev/null || fail "GitHub CLI is missing. Install it with: brew install gh"
gh auth status >/dev/null 2>&1 || fail "Sign in to GitHub first: gh auth login"

branch="$(git branch --show-current)"
if [ "$branch" = "main" ]; then
  [ -n "$BRANCH_ARG" ] || fail "You are on main. Add --branch feature/short-name to put this work on a new branch."
  git switch -c "$BRANCH_ARG"
  branch="$BRANCH_ARG"
fi

step "Issue"
resolve_issue "$branch" "$ISSUE_ARG"

step "Changes on $branch"
if [ -n "$(git status --porcelain)" ]; then
  git status --short
  [ -n "$TITLE" ] || fail "There are uncommitted changes. Give a title: npm run preview -- \"What changed\""
  git add -A
  git commit -q -m "$(with_issue "$TITLE")"
  echo "Committed: $(with_issue "$TITLE")"
fi
git fetch -q origin main
ahead="$(git rev-list --count origin/main..HEAD)"
[ "$ahead" -gt 0 ] || fail "Nothing to preview: $branch has no commits that are not on main."
git log --oneline origin/main..HEAD
[ -n "$TITLE" ] || TITLE="$(git log -1 --pretty=%s)"

step "Checks"
npx tsc --noEmit
npm run -s lint
if [ "$SKIP_BUILD" = 0 ]; then
  npm run -s build >/tmp/emruz-build.log 2>&1 || { tail -40 /tmp/emruz-build.log; fail "Build failed (full log: /tmp/emruz-build.log)"; }
  echo "Build passed."
fi

step "Push"
git push --force-with-lease -u origin "$branch"

step "Pull request"
pr="$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty')"
if [ -n "$pr" ]; then
  echo "Updated open pull request #$pr."
else
  body="$(git log --reverse --pretty='- %s' origin/main..HEAD)"
  [ -z "$ISSUE" ] || body="$(printf '%s\n\nCloses #%s' "$body" "$ISSUE")"
  gh pr create --base main --head "$branch" --title "$TITLE" --body "$body"
  pr="$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty')"
fi
[ -n "$pr" ] || fail "Could not find or open a pull request for $branch."
ensure_closes "$pr"
gh pr view "$pr" --json url --jq .url

printf '\n\033[1;32mPreview building: https://deploy-preview-%s--emruz-website.netlify.app\033[0m\n' "$pr"
echo "Sign in on previews with an email link (Google and Microsoft only accept emruz.com)."
echo "When it looks right: npm run ship"

# Last step: the forwarder keeps running until you stop it, so it runs after everything else
if [ "$STRIPE" = 1 ]; then
  step "Forwarding Stripe test events to preview #$pr (Ctrl-C to stop)"
  bash scripts/stripe-preview.sh "$pr"
fi
