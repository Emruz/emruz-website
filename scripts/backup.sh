#!/usr/bin/env bash
# Mirror backup of this repo outside GitHub.
#   npm run backup            (refresh now; creates the mirror the first time)
#   scripts/backup.sh --due   (refresh only if the last backup is 30 or more days old; ship runs this)
# The mirror lives in ~/Backups/<repo>.git, or in BACKUP_DIR if set.
# It never stops a ship: on any failure it prints a warning and exits 0.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 0

repo="$(basename "$(git rev-parse --show-toplevel)")"
url="$(git remote get-url origin)"
dir="${BACKUP_DIR:-$HOME/Backups}/$repo.git"
stamp="$dir/last-backup"
warn() { printf '\033[1;33mBackup: %s\033[0m\n' "$1" >&2; exit 0; }

if [ "${1:-}" = "--due" ] && [ -f "$stamp" ] && [ -n "$(find "$stamp" -mtime -30 2>/dev/null)" ]; then
  exit 0
fi

if [ -d "$dir" ]; then
  git -C "$dir" remote update --prune >/dev/null 2>&1 || warn "refresh of $dir failed. Run npm run backup to retry."
else
  mkdir -p "$(dirname "$dir")" || warn "can't create $(dirname "$dir")."
  git clone -q --mirror "$url" "$dir" || warn "mirror clone into $dir failed. Run npm run backup to retry."
fi
date -u +%FT%TZ > "$stamp"
echo "Backup: $dir updated."
