#!/bin/bash
set -e

cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"
source .env

FRONTEND_PORT="${FRONTEND_PORT:-49059}"
BACKEND_PORT="${BACKEND_PORT:-59059}"
NODE22_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
  NODE_BIN="$NODE22_BIN/node"
else
  NODE_BIN="$(command -v node)"
fi

get_pid_cwd() {
  local pid="$1"
  lsof -p "$pid" -d cwd -a 2>/dev/null | awk 'NR==2 {print $NF}'
}

safe_kill_port() {
  local port="$1"
  local label="$2"
  local pid
  pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd
    cwd=$(get_pid_cwd "$pid")
    echo "$label port $port is occupied by PID $pid cwd=$cwd"
    case "$cwd" in
      "$PROJECT_DIR"*) kill "$pid" 2>/dev/null || true; sleep 1 ;;
      *) echo "skip $label: port belongs to another project"; exit 1 ;;
    esac
  fi
}

echo "=== Starting Full Stack Application ==="
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port: $BACKEND_PORT"

safe_kill_port "$FRONTEND_PORT" "frontend"
safe_kill_port "$BACKEND_PORT" "backend"
if command -v screen >/dev/null 2>&1; then
  screen -S may-89059-backend -X quit >/dev/null 2>&1 || true
  screen -S may-89059-frontend -X quit >/dev/null 2>&1 || true
fi

export FRONTEND_PORT
export BACKEND_PORT
export NODE_ENV=development

if command -v screen >/dev/null 2>&1; then
  screen -dmS may-89059-backend bash -lc 'cd "$1"; exec env FRONTEND_PORT="$2" BACKEND_PORT="$3" NODE_ENV=development "$4" ./node_modules/tsx/dist/cli.mjs api/server.ts > backend.log 2>&1' _ "$PROJECT_DIR" "$FRONTEND_PORT" "$BACKEND_PORT" "$NODE_BIN"
  screen -dmS may-89059-frontend bash -lc 'cd "$1"; exec env FRONTEND_PORT="$2" BACKEND_PORT="$3" NODE_ENV=development "$4" ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$2" --strictPort > frontend.log 2>&1' _ "$PROJECT_DIR" "$FRONTEND_PORT" "$BACKEND_PORT" "$NODE_BIN"
else
  nohup "$NODE_BIN" ./node_modules/tsx/dist/cli.mjs api/server.ts < /dev/null > backend.log 2>&1 &
  nohup "$NODE_BIN" ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort < /dev/null > frontend.log 2>&1 &
fi
echo "Backend launch requested"
echo "Frontend launch requested"

echo "=== Waiting for services ==="
for _ in {1..30}; do
  frontend_pid=$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1)
  backend_pid=$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$frontend_pid" ] && [ -n "$backend_pid" ]; then
    break
  fi
  sleep 1
done

echo "Frontend port $FRONTEND_PORT: ${frontend_pid:-NOT LISTENING}"
echo "Backend port $BACKEND_PORT: ${backend_pid:-NOT LISTENING}"
echo "${backend_pid:-}" > backend.pid
echo "${frontend_pid:-}" > frontend.pid

echo "Frontend HTTP:"
curl -sS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend health:"
curl -sS "http://127.0.0.1:$BACKEND_PORT/api/health"
echo
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT/"
