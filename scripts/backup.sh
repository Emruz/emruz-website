#!/usr/bin/env bash
# Mirror backup of this repo outside GitHub.
#   npm run backup            (refresh now; creates the mirror the first time)
#   scripts/backup.sh --due   (refresh only if the last backup is 30 or more days old; ship runs this)
# The mirror lives in ~/Backups/<repo>.git, or in BACKUP_DIR if set.
# With --due (from ship) a failure prints a warning and exits 0, so it never stops a ship.
# Run by hand, a failure exits 1.
# Refs deleted on GitHub stay in the mirror (no --prune); main can't be deleted or force-pushed.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 0

repo="$(basename "$(git rev-parse --show-toplevel)")"
url="$(git remote get-url origin)"
dir="${BACKUP_DIR:-$HOME/Backups}/$repo.git"
stamp="$dir/last-backup"
due=0; [ "${1:-}" = "--due" ] && due=1
warn() { printf '\033[1;33mBackup: %s\033[0m\n' "$1" >&2; [ "$due" = 1 ] && exit 0; exit 1; }

if [ "$due" = 1 ] && [ -f "$stamp" ] && [ -n "$(find "$stamp" -mtime -30 2>/dev/null)" ]; then
  exit 0
fi

if [ -d "$dir" ]; then
  git -C "$dir" remote update >/dev/null 2>&1 || warn "refresh of $dir failed. Run npm run backup to retry."
else
  mkdir -p "$(dirname "$dir")" || warn "can't create $(dirname "$dir")."
  git clone -q --mirror "$url" "$dir" || warn "mirror clone into $dir failed. Run npm run backup to retry."
fi
date -u +%FT%TZ > "$stamp"
echo "Backup: $dir updated."
