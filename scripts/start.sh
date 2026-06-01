#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
. "$PROJECT_DIR/.env"
set +a

HOST="${HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-43454}"
BACKEND_PORT="${BACKEND_PORT:-53454}"
NODE_BIN="$(command -v node)"
JOB_PREFIX="$(basename "$PROJECT_DIR" | tr -cd '[:alnum:]')"
BACKEND_LABEL="${JOB_PREFIX}backend"
FRONTEND_LABEL="${JOB_PREFIX}frontend"

belongs_to_project() {
  local pid="$1"
  local cwd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)"
  case "$cwd" in
    "$PROJECT_DIR"*) return 0 ;;
    *) return 1 ;;
  esac
}

release_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  if [ -z "$pid" ]; then
    return 0
  fi
  if belongs_to_project "$pid"; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    return 0
  fi
  echo "Port $port is used by another project; choose a backup slot in .env first." >&2
  exit 1
}

stop_launchd_jobs() {
  if command -v launchctl >/dev/null 2>&1; then
    launchctl remove "$BACKEND_LABEL" 2>/dev/null || true
    launchctl remove "$FRONTEND_LABEL" 2>/dev/null || true
  fi
}

stop_launchd_jobs
release_port "$FRONTEND_PORT"
release_port "$BACKEND_PORT"

rm -f "$PROJECT_DIR/backend.log" "$PROJECT_DIR/frontend.log"

if command -v launchctl >/dev/null 2>&1; then
  rm -f "$PROJECT_DIR/backend.pid" "$PROJECT_DIR/frontend.pid"
  launchctl submit -l "$BACKEND_LABEL" -- /bin/bash -lc "cd '$PROJECT_DIR'; echo \$\$ > backend.pid; exec '$NODE_BIN' backend/server.js >> backend.log 2>&1"
  launchctl submit -l "$FRONTEND_LABEL" -- /bin/bash -lc "cd '$PROJECT_DIR'; echo \$\$ > frontend.pid; exec '$NODE_BIN' frontend/server.js >> frontend.log 2>&1"
else
  nohup "$NODE_BIN" "$PROJECT_DIR/backend/server.js" > "$PROJECT_DIR/backend.log" 2>&1 < /dev/null &
  echo "$!" > "$PROJECT_DIR/backend.pid"

  nohup "$NODE_BIN" "$PROJECT_DIR/frontend/server.js" > "$PROJECT_DIR/frontend.log" 2>&1 < /dev/null &
  echo "$!" > "$PROJECT_DIR/frontend.pid"
fi

sleep 2
"$PROJECT_DIR/scripts/check.sh"
