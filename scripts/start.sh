#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
MODE="${1:-dev}"

set -a
source "$ENV_FILE"
set +a

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

owned_pid_on_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -n "$pid" ] || return 0
  local cwd args
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 || true)"
  args="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  if [[ "$cwd" == "$PROJECT_DIR"* || "$args" == *"$PROJECT_DIR"* ]]; then
    kill "$pid" 2>/dev/null || true
  else
    echo "Port $port is occupied by another project: PID=$pid CWD=$cwd"
    exit 1
  fi
}

wait_http() {
  local name="$1"
  local url="$2"
  local max="${3:-30}"
  for _ in $(seq 1 "$max"); do
    local code
    code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null || true)"
    if [ "$code" = "200" ]; then
      echo "$name HTTP 200"
      return 0
    fi
    sleep 1
  done
  echo "$name failed: $url"
  return 1
}

owned_pid_on_port "$FRONTEND_PORT"
owned_pid_on_port "$BACKEND_PORT"

mkdir -p "$PROJECT_DIR/data"

HOST="$HOST" FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" DB_PATH="$DB_PATH" \
  nohup "$NODE_BIN" "$PROJECT_DIR/backend/server.js" > "$PROJECT_DIR/backend.log" 2>&1 &
echo $! > "$PROJECT_DIR/backend.pid"

if [ "$MODE" = "prod" ]; then
  HOST="$HOST" FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" \
    nohup "$NODE_BIN" "$PROJECT_DIR/frontend/server.js" > "$PROJECT_DIR/frontend.log" 2>&1 &
  echo $! > "$PROJECT_DIR/frontend.pid"
else
  nohup npx vite --host 127.0.0.1 --port "$FRONTEND_PORT" > "$PROJECT_DIR/frontend.log" 2>&1 &
  echo $! > "$PROJECT_DIR/frontend.pid"
fi

wait_http "Backend" "http://127.0.0.1:$BACKEND_PORT/api/health"
wait_http "Frontend" "http://127.0.0.1:$FRONTEND_PORT/" 60

echo ""
echo "=== 山东省文旅场所智慧监管服务平台 ==="
echo "  Mode:     $MODE"
echo "  Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT/api/health"
if [ "$MODE" = "dev" ]; then
  echo "  Proxy:    /api → http://127.0.0.1:$BACKEND_PORT"
  echo "  Mock:     $(grep VITE_USE_MOCK "$PROJECT_DIR/.env.development" 2>/dev/null | cut -d= -f2 || echo 'true')"
fi
