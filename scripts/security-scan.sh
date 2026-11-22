#!/usr/bin/env bash
# Static security checks for this repo. Same script locally (ship script) and
# in GitHub Actions (security-scan job), so results match.
#
#   Semgrep      SAST, community rules pinned to one commit
#   gitleaks     secrets committed anywhere in the history
#   clippy       Rust correctness and suspicious lints     (Rust only)
#   cargo audit  Rust libraries with known vulnerabilities (Rust only)
#   npm audit    Node libraries, high or critical          (npm or pnpm only)
#   exceptions   every reviewed exception carries a reason
#   extra        executables in scripts/security-scan.d/   (optional)
#
#   scripts/security-scan.sh                       all checks
#   scripts/security-scan.sh --skip clippy         skip one (recorded in the summary)
#   scripts/security-scan.sh --report FILE         also write a markdown report
#
# Install once (macOS): brew install semgrep gitleaks && cargo install cargo-audit
# Linux: pipx install semgrep; gitleaks and cargo-audit from their releases.
#
# Reviewed exceptions, each with its reason:
#   scripts/semgrep-exclude.txt                 Semgrep rule ids that don't apply
#   .semgrepignore                              paths Semgrep skips
#   "nosemgrep: <rule-id> <reason>" comments    single reviewed lines
#   .cargo/audit.toml, .github/npm-audit-baseline.json, .gitleaks.toml, .gitleaksignore
# Anything new fails the scan.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)" || { echo "run inside a git repo"; exit 1; }
cd "$ROOT" || exit 1

# ---- Settings (repo-ci-checks fills these) ---------------------------------
# Rules, severity and exception files are fixed here so a change shows in review.
RULES_REV=a5ad1714f00c9f7fde980cab0ea1d6dc6d414fd2  # semgrep-rules commit
RULES=.semgrep-rules                                # git-ignored
SEMGREP_SEVERITY="WARNING ERROR"                    # any finding at these levels fails
EXCLUDE_FILE="$SCRIPT_DIR/semgrep-exclude.txt"
NPM_BASELINE=.github/npm-audit-baseline.json
EXTRA_DIR="$SCRIPT_DIR/security-scan.d"
# Where to look. Empty means detect; the environment may override.
SEMGREP_RULE_DIRS="${SEMGREP_RULE_DIRS-}"  # e.g. "rust typescript javascript generic/secrets"
SEMGREP_TARGETS="${SEMGREP_TARGETS-.}"     # paths to scan; .semgrepignore trims them
RUST_DIRS="${RUST_DIRS-}"                  # folders with Cargo.lock
CLIPPY_DIRS="${CLIPPY_DIRS-}"              # crates to lint; empty = RUST_DIRS
CLIPPY_ARGS="${CLIPPY_ARGS-}"              # e.g. "--lib"
NODE_DIRS="${NODE_DIRS-}"                  # folders with package-lock.json or pnpm-lock.yaml
# -----------------------------------------------------------------------------

usage() { echo "usage: scripts/security-scan.sh [--skip semgrep|gitleaks|clippy|cargo-audit|npm-audit|exceptions|extra]... [--report FILE]"; exit 1; }
SKIP=" "; REPORT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --skip) [ -n "${2:-}" ] || usage; SKIP="$SKIP$2 "; shift 2 ;;
    --no-rust) SKIP="${SKIP}clippy "; shift ;;
    --report) [ -n "${2:-}" ] || usage; REPORT="$2"; shift 2 ;;
    *) usage ;;
  esac
done
export SEMGREP_SEND_METRICS=off

fail=0
results=()
record() { # name status
  results+=("$1|$2")
  case "$2" in ok|n/a*|skipped*) ;; *) fail=1 ;; esac
}
skipped() { case "$SKIP" in *" $1 "*) record "$1" "skipped (--skip $1)"; return 0 ;; esac; return 1; }
indent() { printf '%s\n' "$1" | while IFS= read -r l; do echo "    $l"; done; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "  $1 isn't installed: $2"; return 1; }; }
has() { [ -n "$(git ls-files -- "$@" | head -1)" ]; }  # not grep -q: SIGPIPE + pipefail
lock_dirs() { git ls-files -- "*$1" "$1" | while read -r f; do dirname "$f"; done | sort -u; }

# ---- Semgrep ----------------------------------------------------------------
echo "== Semgrep (SAST)"
if ! skipped semgrep; then
  if [ -z "$SEMGREP_RULE_DIRS" ]; then
    SEMGREP_RULE_DIRS="generic/secrets"
    has '*.rs' && SEMGREP_RULE_DIRS="$SEMGREP_RULE_DIRS rust"
    has '*.ts' '*.tsx' && SEMGREP_RULE_DIRS="$SEMGREP_RULE_DIRS typescript"
    has '*.js' '*.jsx' '*.mjs' '*.cjs' '*.ts' '*.tsx' && SEMGREP_RULE_DIRS="$SEMGREP_RULE_DIRS javascript"
    has '*.py' && SEMGREP_RULE_DIRS="$SEMGREP_RULE_DIRS python"
    has '*.go' && SEMGREP_RULE_DIRS="$SEMGREP_RULE_DIRS go"
    has '.github/workflows/*' && SEMGREP_RULE_DIRS="$SEMGREP_RULE_DIRS yaml/github-actions"
  fi
  # Semgrep prints matched lines unredacted. In CI logs (public on public repos)
  # leave secrets to gitleaks, which redacts.
  [ -n "${CI:-}" ] && SEMGREP_RULE_DIRS="$(echo " $SEMGREP_RULE_DIRS " | sed 's# generic/secrets # #g')"
  want="$RULES_REV $SEMGREP_RULE_DIRS"
  if need semgrep "brew install semgrep (or: pipx install semgrep)"; then
    if [ "$(cat "$RULES/.rev" 2>/dev/null)" != "$want" ]; then
      echo "  Fetching Semgrep rules ($RULES_REV: $SEMGREP_RULE_DIRS)..."
      rm -rf "$RULES"
      tmp="$(mktemp -d)"
      if (cd "$tmp" && git init -q && git remote add origin https://github.com/semgrep/semgrep-rules.git \
          && git fetch -q --depth 1 origin "$RULES_REV" && git checkout -q FETCH_HEAD); then
        # shellcheck disable=SC2086  # word splitting of the dir list is intended
        (cd "$tmp" && find $SEMGREP_RULE_DIRS -name '*.yaml' ! -name '*.test.yaml' ! -path '*/test*' 2>/dev/null) |
          while read -r f; do mkdir -p "$RULES/$(dirname "$f")" && cp "$tmp/$f" "$RULES/$f"; done
        echo "$want" > "$RULES/.rev"
      fi
      rm -rf "$tmp"
    fi
    if [ "$(cat "$RULES/.rev" 2>/dev/null)" = "$want" ]; then
      args=()
      for s in $SEMGREP_SEVERITY; do args+=(--severity "$s"); done
      if [ -f "$EXCLUDE_FILE" ]; then
        while read -r rule _; do
          [ -n "$rule" ] && args+=(--exclude-rule "semgrep-rules.$rule")
        done < <(grep -v '^[[:space:]]*#' "$EXCLUDE_FILE")
      fi
      # shellcheck disable=SC2086  # SEMGREP_TARGETS is a path list
      if semgrep scan --config "$RULES" --metrics off --quiet --error "${args[@]}" $SEMGREP_TARGETS; then
        record semgrep ok
      else
        record semgrep FAIL
      fi
    else
      echo "  Could not fetch the Semgrep rules from GitHub."
      record semgrep FAIL
    fi
  else
    record semgrep "FAIL (not installed)"
  fi
fi

# ---- gitleaks -----------------------------------------------------------------
echo "== gitleaks (secrets in history)"
if ! skipped gitleaks; then
  if need gitleaks "brew install gitleaks"; then
    cfg=(); [ -f .gitleaks.toml ] && cfg=(--config .gitleaks.toml)
    if gitleaks git . ${cfg[@]+"${cfg[@]}"} --redact --no-banner --exit-code 1 --log-level warn; then
      record gitleaks ok
    else
      record gitleaks FAIL
    fi
  else
    record gitleaks "FAIL (not installed)"
  fi
fi

# ---- Rust ---------------------------------------------------------------------
[ -n "$RUST_DIRS" ] || RUST_DIRS="$(lock_dirs Cargo.lock | tr '\n' ' ')"
echo "== clippy (Rust)"
if [ -z "$RUST_DIRS" ]; then record clippy "n/a (no Rust)"
elif ! skipped clippy; then
  if need cargo "install Rust: https://rustup.rs"; then
    ok=1
    for d in ${CLIPPY_DIRS:-$RUST_DIRS}; do
      # Only the correctness and suspicious groups: real bugs, not style.
      # shellcheck disable=SC2086
      (cd "$d" && cargo clippy $CLIPPY_ARGS --no-deps --quiet -- -A clippy::all -D clippy::correctness -D clippy::suspicious) || ok=0
    done
    if [ $ok = 1 ]; then record clippy ok; else record clippy FAIL; fi
  else
    record clippy "FAIL (not installed)"
  fi
fi

echo "== cargo audit (Rust libraries)"
if [ -z "$RUST_DIRS" ]; then record cargo-audit "n/a (no Rust)"
elif ! skipped cargo-audit; then
  if need cargo-audit "cargo install cargo-audit --locked"; then
    ok=1
    # Reads .cargo/audit.toml from the repo root for reviewed ignores.
    for d in $RUST_DIRS; do cargo audit --quiet --file "$d/Cargo.lock" || ok=0; done
    if [ $ok = 1 ]; then record cargo-audit ok; else record cargo-audit FAIL; fi
  else
    record cargo-audit "FAIL (not installed)"
  fi
fi

# ---- Node ---------------------------------------------------------------------
[ -n "$NODE_DIRS" ] || NODE_DIRS="$( (lock_dirs package-lock.json; lock_dirs pnpm-lock.yaml) | sort -u | tr '\n' ' ')"
echo "== npm audit (Node libraries, high or critical)"
if [ -z "$NODE_DIRS" ]; then record npm-audit "n/a (no npm or pnpm lockfile)"
elif ! skipped npm-audit; then
  if need node "install Node.js"; then
    ok=1
    for d in $NODE_DIRS; do
      report="$(mktemp)"
      if [ -f "$d/pnpm-lock.yaml" ]; then
        need pnpm "npm install -g pnpm" || { ok=0; continue; }
        (cd "$d" && pnpm audit --prod --json > "$report" 2>/dev/null) || true
      else
        (cd "$d" && npm audit --omit=dev --json > "$report" 2>/dev/null) || true
      fi
      # High or critical advisories not in the reviewed baseline fail.
      node - "$report" "$NPM_BASELINE" "$d" <<'JS' || ok=0
const fs = require('fs');
const [file, basePath, dir] = process.argv.slice(2);
let r;
try { r = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { console.log(`  ${dir}: audit gave no JSON (run npm/pnpm install first)`); process.exit(1); }
if (r.error) { console.log(`  ${dir}: ${r.error.summary || r.error.code}`); process.exit(1); }
const serious = new Map();
const bad = (s) => s === 'high' || s === 'critical';
for (const a of Object.values(r.advisories || {}))                     // pnpm
  if (bad(a.severity)) serious.set(a.github_advisory_id || String(a.id), `${a.module_name} ${a.severity}: ${a.title}`);
for (const [name, v] of Object.entries(r.vulnerabilities || {}))      // npm 7+
  for (const via of v.via || []) if (typeof via === 'object' && bad(via.severity)) {
    const id = (via.url || '').split('/').pop() || String(via.source);
    serious.set(id, `${name} ${via.severity}: ${via.title}`);
  }
let known = new Set();
try { known = new Set((JSON.parse(fs.readFileSync(basePath, 'utf8')).advisories || []).map((a) => a.id)); } catch {}
const fresh = [...serious].filter(([id]) => !known.has(id));
console.log(`  ${dir}: ${serious.size} high/critical, ${serious.size - fresh.length} in baseline, ${fresh.length} new`);
for (const [id, t] of fresh) console.log(`  NEW ${id} ${t}`);
process.exit(fresh.length ? 1 : 0);
JS
      rm -f "$report"
    done
    if [ $ok = 1 ]; then record npm-audit ok; else record npm-audit FAIL; fi
  else
    record npm-audit "FAIL (not installed)"
  fi
fi

# ---- Exceptions need reasons ----------------------------------------------------
echo "== exceptions (each has a reason)"
if ! skipped exceptions; then
  bad=0
  # Entries in these files must sit under a comment (one comment may cover a group).
  for f in "$EXCLUDE_FILE" .semgrepignore .gitleaksignore; do
    [ -f "$f" ] || continue
    out="$(awk -v n="${f#"$ROOT"/}" '/^[[:space:]]*#/ {c=1; next} /^[[:space:]]*$/ {c=0; next} !c {print n":"NR": "$0}' "$f")"
    [ -z "$out" ] || { echo "  No reason comment above:"; indent "$out"; bad=1; }
  done
  if [ -f .cargo/audit.toml ]; then
    out="$(awk '/ignore[[:space:]]*=/ {on=1; c=0} on && /^[[:space:]]*#/ {c=1; next} on && /^[[:space:]]*$/ {c=0; next}
                on && /"RUSTSEC-/ && !c {print ".cargo/audit.toml:"NR": "$0} on && /\]/ {on=0}' .cargo/audit.toml)"
    [ -z "$out" ] || { echo "  RUSTSEC ignore without a reason comment:"; indent "$out"; bad=1; }
  fi
  # A nosemgrep directive needs a rule id and a reason after it.
  out="$(git grep -n -I -E 'nosemgrep([[:space:]]*(:|$|\*/|-->))' -- . ':!*.md' ":!**/$(basename "$0")" ':!**/semgrep-exclude.txt' 2>/dev/null |
         grep -v -E 'nosemgrep:[[:space:]]*[A-Za-z0-9_.,-]+[[:space:]]+(--[[:space:]]+)?[^[:space:]*/>-]' || true)"
  [ -z "$out" ] || { echo "  nosemgrep without 'nosemgrep: <rule-id> <reason>':"; indent "$out"; bad=1; }
  if [ $bad = 0 ]; then record exceptions ok; else record exceptions FAIL; fi
fi

# ---- Project checks ---------------------------------------------------------------
if [ -d "$EXTRA_DIR" ]; then
  for x in "$EXTRA_DIR"/*; do
    [ -x "$x" ] || continue
    n="$(basename "$x")"; n="${n%.*}"
    echo "== $n (project check)"
    case "$SKIP" in *" $n "*|*" extra "*) record "$n" "skipped (--skip)"; continue ;; esac
    if "$x"; then record "$n" ok; else record "$n" FAIL; fi
  done
fi

# ---- Summary ------------------------------------------------------------------------
verdict=PASSED; [ $fail -eq 0 ] || verdict=FAILED
echo
echo "Security scan:"
for r in "${results[@]}"; do printf '  %-12s %s\n' "${r%%|*}" "${r#*|}"; done
echo "$verdict"
if [ -n "$REPORT" ]; then
  mkdir -p "$(dirname "$REPORT")"
  {
    echo "# Security scan"
    echo
    echo "Commit $(git rev-parse --short HEAD) on $(git branch --show-current 2>/dev/null || echo detached), $(date -u +%Y-%m-%dT%H:%MZ). Rules $RULES_REV. Result: **$verdict**"
    echo
    echo "| Check | Result |"
    echo "|---|---|"
    for r in "${results[@]}"; do echo "| ${r%%|*} | ${r#*|} |"; done
  } > "$REPORT"
fi
exit $fail
