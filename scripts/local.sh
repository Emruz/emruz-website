#!/usr/bin/env bash
# Build and run the site locally: checks, packages, database, then the dev server.
#   npm run local            full run
#   npm run local -- --fast  skip type check and lint
set -euo pipefail
cd "$(dirname "$0")/.."

FAST=0
for arg in "$@"; do [ "$arg" = "--fast" ] && FAST=1; done

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31mError: %s\033[0m\n' "$1" >&2; exit 1; }

# Settings from .env.local (DATABASE_URL, SITE_URL, ADMIN_EMAILS...)
if [ -f .env.local ]; then
  set -a; . ./.env.local; set +a
fi
export DATABASE_URL="${DATABASE_URL:-postgres://localhost/emruz}"
PORT="${PORT:-3000}"

step "Node"
want="$(tr -d 'v \n' < .nvmrc 2>/dev/null || echo 24)"
have="$(node -v | sed 's/^v//; s/\..*//')"
[ "$have" = "$want" ] || fail "Node $want is expected, this is $(node -v). Install it with: brew install node@$want"
node -v

step "Packages"
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm install --no-fund --no-audit
else
  echo "Up to date."
fi

step "Database"
db_host="$(node -e 'const u=new URL(process.env.DATABASE_URL);console.log(u.hostname||"localhost")')"
db_name="$(node -e 'const u=new URL(process.env.DATABASE_URL);console.log(u.pathname.slice(1))')"
if command -v pg_isready >/dev/null && ! pg_isready -q -h "$db_host"; then
  fail "Postgres is not running on $db_host. Open Postgres.app and press Start."
fi
if command -v psql >/dev/null && ! psql "$DATABASE_URL" -c 'select 1' >/dev/null 2>&1; then
  echo "Creating database $db_name"
  createdb -h "$db_host" "$db_name"
fi
npm run -s db:migrate

if [ "$FAST" = 0 ]; then
  step "Type check"
  npx tsc --noEmit
  step "Lint"
  npm run -s lint
fi

step "Port $PORT"
pids="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
if [ -n "$pids" ]; then
  echo "Stopping what is using port $PORT (PID $pids)"
  kill $pids 2>/dev/null || true
  sleep 1
  pids="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
  [ -z "$pids" ] || kill -9 $pids 2>/dev/null || true
fi

step "Dev server on http://localhost:$PORT (Ctrl+C to stop)"
exec npx next dev -p "$PORT"
