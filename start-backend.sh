#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi
FRONTEND_PORT="${FRONTEND_PORT:-49059}"
BACKEND_PORT="${BACKEND_PORT:-59059}"
NODE22_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
  NODE_BIN="$NODE22_BIN/node"
else
  NODE_BIN="$(command -v node)"
fi

echo "=== Starting backend on port $BACKEND_PORT ==="

get_pid_cwd() {
  local pid="$1"
  lsof -p "$pid" -d cwd -a 2>/dev/null | awk 'NR==2 {print $NF}'
}

# Stop only this project's existing listener on the backend port.
pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$pid" ]; then
  cwd=$(get_pid_cwd "$pid")
  cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  case "$cwd" in
    "$PROJECT_DIR"*) echo "Stopping existing backend PID $pid"; kill "$pid" 2>/dev/null || true; sleep 2 ;;
    *) echo "Skip kill: cwd=$cwd cmd=$cmd"; exit 1 ;;
  esac
fi

export FRONTEND_PORT
export BACKEND_PORT
export NODE_ENV=development

if command -v screen >/dev/null 2>&1; then
  screen -S may-89059-backend -X quit >/dev/null 2>&1 || true
  screen -dmS may-89059-backend bash -lc 'cd "$1"; exec env FRONTEND_PORT="$2" BACKEND_PORT="$3" NODE_ENV=development "$4" ./node_modules/tsx/dist/cli.mjs api/server.ts > backend.log 2>&1' _ "$PROJECT_DIR" "$FRONTEND_PORT" "$BACKEND_PORT" "$NODE_BIN"
else
  nohup "$NODE_BIN" ./node_modules/tsx/dist/cli.mjs api/server.ts < /dev/null > backend.log 2>&1 &
fi
echo "Backend launch requested"

for _ in {1..30}; do
  if lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
echo ""
echo "=== Backend log (last 30 lines) ==="
tail -30 backend.log
echo ""
echo "=== Port check for $BACKEND_PORT ==="
lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN
PID=$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
echo "$PID" > backend.pid
echo ""
echo "=== Backend health check ==="
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
echo ""
echo "=== Process status ==="
ps -p "$PID" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "Process not running"
