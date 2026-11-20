# Shared by ship.sh and preview.sh: works out which GitHub issue this branch is for,
# so commits carry "(#N)" and the pull request closes the issue when it merges.
#
# Order: --issue N, then a number at the start of the branch name
# (feature/42-onboarding), then "#N" in the branch's commits, then ask.
# Enter at the prompt skips; --no-issue skips without asking.

resolve_issue() {
  local branch="$1" given="$2"
  ISSUE=""
  if [ "$given" = "none" ]; then return; fi
  if [ -n "$given" ]; then
    ISSUE="${given#\#}"
  elif [[ "$branch" =~ ^[^/]+/([0-9]+)- ]]; then
    ISSUE="${BASH_REMATCH[1]}"
  else
    git fetch -q origin main 2>/dev/null || true
    ISSUE="$(git log --format='%s %b' origin/main..HEAD 2>/dev/null |
      grep -oE '#[0-9]+' | tr -d '#' | sort | uniq -c | sort -rn | awk 'NR==1{print $2}')"
  fi
  if [ -z "$ISSUE" ] && [ -t 0 ]; then
    read -r -p "Issue number for this change (Enter to skip): " ISSUE
    ISSUE="${ISSUE#\#}"
  fi
  [ -z "$ISSUE" ] && { echo "No issue linked."; return; }
  [[ "$ISSUE" =~ ^[0-9]+$ ]] || fail "Issue must be a number, got: $ISSUE"
  local title
  title="$(gh issue view "$ISSUE" --json title,state --jq '"\(.title) [\(.state)]"' 2>/dev/null)" ||
    fail "Issue #$ISSUE was not found in this repository."
  echo "Issue #$ISSUE: $title"
}

# "Title" -> "Title (#N)" unless it already mentions #N
with_issue() {
  if [ -n "$ISSUE" ] && [[ "$1" != *"#$ISSUE"* ]]; then echo "$1 (#$ISSUE)"; else echo "$1"; fi
}

# Make sure an open pull request's description says "Closes #N"
ensure_closes() {
  local pr="$1" body
  [ -n "$ISSUE" ] || return 0
  body="$(gh pr view "$pr" --json body --jq .body)"
  if ! grep -qiE "(close[sd]?|fix(e[sd])?|resolve[sd]?) #$ISSUE([^0-9]|$)" <<<"$body"; then
    gh pr edit "$pr" --body "$(printf '%s\n\nCloses #%s' "$body" "$ISSUE")" >/dev/null
    echo "Added \"Closes #$ISSUE\" to pull request #$pr."
  fi
}
