#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89075"
BACKEND_DIR="$PROJECT_DIR/backend"
ENV_FILE="$PROJECT_DIR/.env"
LOG_FILE="$PROJECT_DIR/backend.log"
PID_FILE="$PROJECT_DIR/backend.pid"
SCREEN_SESSION="may89075_backend"
NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="node"
fi

BACKEND_PORT="$(grep -E '^BACKEND_PORT=' "$ENV_FILE" | cut -d= -f2)"
BACKEND_PORT="${BACKEND_PORT:-59075}"

current_pid="$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true)"
if [ -n "$current_pid" ]; then
  current_cwd="$(lsof -a -p "$current_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)"
  if [[ "$current_cwd" == "$PROJECT_DIR"* ]]; then
    echo "$current_pid" > "$PID_FILE"
    echo "backend already running on http://127.0.0.1:$BACKEND_PORT pid=$current_pid" >> "$LOG_FILE"
    exit 0
  fi
fi

cd "$BACKEND_DIR"
screen -S "$SCREEN_SESSION" -X quit >/dev/null 2>&1 || true
screen -dmS "$SCREEN_SESSION" bash -lc "cd '$BACKEND_DIR' && exec '$NODE_BIN' src/server.js >> '$LOG_FILE' 2>&1"
sleep 2

started_pid="$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true)"

if [ -z "$started_pid" ]; then
  echo "backend failed to start on http://127.0.0.1:$BACKEND_PORT" >> "$LOG_FILE"
  exit 1
fi

echo "$started_pid" > "$PID_FILE"
echo "backend started on http://127.0.0.1:$BACKEND_PORT pid=$started_pid" >> "$LOG_FILE"
