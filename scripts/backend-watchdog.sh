#!/bin/sh
set -u

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
PORT="${PORT:-59019}"
LOG_FILE="$PROJECT_ROOT/backend.log"

while true; do
  if /usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    sleep 1
    continue
  fi

  {
    printf '\n--- watchdog backend start %s may-89019: %s dist/index.js ---\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$NODE_BIN"
  } >> "$LOG_FILE"

  (
    cd "$BACKEND_DIR" || exit 1
    HOST=127.0.0.1 BACKEND_PORT="$PORT" PORT="$PORT" NODE_ENV=production "$NODE_BIN" dist/index.js
  ) >> "$LOG_FILE" 2>&1

  status=$?
  printf 'backend exited with status %s at %s\n' "$status" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG_FILE"
  sleep 1
done
