#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR/frontend"

LOG_FILE="../frontend.log"
PID_FILE="../frontend.pid"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi

FRONTEND_PORT="${FRONTEND_PORT:-49055}"
BACKEND_PORT="${BACKEND_PORT:-59055}"
NODE22_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin"

if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

echo "Starting frontend dev server at $(date)" >> "$LOG_FILE"

trap '' HUP TSTP INT TERM

if command -v screen >/dev/null 2>&1; then
  screen -dmS may-89055-frontend bash -lc 'cd "$1"; export PATH="$2:$PATH"; exec env FRONTEND_PORT="$3" BACKEND_PORT="$4" node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$3" --strictPort > "$5" 2>&1' _ "$PWD" "$NODE22_BIN" "$FRONTEND_PORT" "$BACKEND_PORT" "$LOG_FILE"
else
  nohup env FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" ./node_modules/.bin/vite --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort > "$LOG_FILE" 2>&1 < /dev/null &
  disown $!
fi

sleep 2
PID=""
for _ in {1..30}; do
  PID=$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
  if [ -n "$PID" ] && curl -sS --max-time 1 "http://127.0.0.1:$FRONTEND_PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
echo "$PID" > "$PID_FILE"

if [ -z "$PID" ]; then
  echo "Frontend failed to become ready on http://127.0.0.1:$FRONTEND_PORT" >&2
  exit 1
fi

echo "Frontend started on http://127.0.0.1:$FRONTEND_PORT with PID $PID"
