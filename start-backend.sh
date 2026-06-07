#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR/backend"

LOG_FILE="../backend.log"
PID_FILE="../backend.pid"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi

BACKEND_PORT="${BACKEND_PORT:-59055}"
NODE22_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin"

if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

echo "Starting backend server at $(date)" >> "$LOG_FILE"

trap '' HUP TSTP INT TERM

if command -v screen >/dev/null 2>&1; then
  screen -dmS may-89055-backend bash -lc 'cd "$1"; export PATH="$2:$PATH"; exec env BACKEND_PORT="$3" node --import tsx src/index.ts > "$4" 2>&1' _ "$PWD" "$NODE22_BIN" "$BACKEND_PORT" "$LOG_FILE"
else
  nohup env BACKEND_PORT="$BACKEND_PORT" node --import tsx src/index.ts > "$LOG_FILE" 2>&1 < /dev/null &
  disown $!
fi

sleep 2
PID=""
for _ in {1..30}; do
  PID=$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
  if [ -n "$PID" ] && curl -sS --max-time 1 "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
echo "$PID" > "$PID_FILE"

if [ -z "$PID" ]; then
  echo "Backend failed to become ready on http://127.0.0.1:$BACKEND_PORT" >&2
  exit 1
fi

echo "Backend started on http://127.0.0.1:$BACKEND_PORT with PID $PID"
