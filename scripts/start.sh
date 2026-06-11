#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

set -a
source "$ENV_FILE"
set +a

NODE_BIN="${NODE_BIN:-$(command -v node)}"

owned_pid_on_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -n "$pid" ] || return 0
  local cwd cmdline
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 || true)"
  cmdline="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  if [[ "$cwd" == "$PROJECT_DIR"* || "$cmdline" == *"$PROJECT_DIR"* ]]; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  else
    echo "Port $port is occupied by another project: pid=$pid cwd=$cwd"
    exit 1
  fi
}

wait_http() {
  local name="$1"
  local url="$2"
  for _ in {1..25}; do
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

nohup "$NODE_BIN" "$PROJECT_DIR/backend/local-server.js" > "$PROJECT_DIR/backend.log" 2>&1 &
echo $! > "$PROJECT_DIR/backend.pid"

(
  cd "$PROJECT_DIR/frontend/citizen-portal"
  nohup npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
  echo $! > "$PROJECT_DIR/frontend.pid"
)

wait_http "Backend" "http://127.0.0.1:$BACKEND_PORT/api/health"
wait_http "Frontend" "http://127.0.0.1:$FRONTEND_PORT/"

echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
