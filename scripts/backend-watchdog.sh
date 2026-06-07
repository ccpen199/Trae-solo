#!/bin/sh
set -u

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
PORT="${PORT:-59018}"

while true; do
  if /usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    sleep 2
    continue
  fi

  cd "$BACKEND_DIR"
  status=0
  "$NODE_BIN" src/server.js
  status=$?
  echo "backend exited with status $status at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  sleep 1
done
