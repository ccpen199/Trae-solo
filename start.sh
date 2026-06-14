#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi

FRONTEND_PORT=${FRONTEND_PORT:-49070}
BACKEND_PORT=${BACKEND_PORT:-59070}
HOST=${HOST:-127.0.0.1}

NODE22_BIN="$HOME/.nvm/versions/node/v22.22.0/bin"
if [ ! -x "$NODE22_BIN/node" ]; then
  NODE22_BIN="/opt/homebrew/opt/node@22/bin"
fi
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

export FRONTEND_PORT BACKEND_PORT HOST VITE_API_BASE_URL NODE_ENV DATABASE_URL

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

is_project_pid() {
  local pid="$1"
  local cmd
  local cwd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
  cwd=$(pid_cwd "$pid")
  [[ "$cmd" == *"$PROJECT_DIR"* || "$cwd" == "$PROJECT_DIR"* || "$cwd" == "$PROJECT_DIR"/* ]]
}

stop_project_port() {
  local label="$1"
  local port="$2"
  local killed=0
  local pids
  pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | sort -u || true)
  for pid in $pids; do
    if is_project_pid "$pid"; then
      echo "Stopping existing $label process on port $port (PID: $pid)"
      kill "$pid" 2>/dev/null || true
      killed=1
    else
      echo "Skipping $label PID $pid - not from this project"
    fi
  done
  if [ "$killed" -eq 1 ]; then
    sleep 2
  fi
}

start_detached() {
  local workdir="$1"
  local logfile="$2"
  shift 2
  node -e '
const fs = require("fs");
const { spawn } = require("child_process");
const [cwd, logfile, command, ...args] = process.argv.slice(1);
const out = fs.openSync(logfile, "a");
const child = spawn(command, args, {
  cwd,
  detached: true,
  stdio: ["ignore", out, out],
  env: process.env
});
child.unref();
console.log(child.pid);
' "$workdir" "$logfile" "$@"
}

http_code() {
  curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "$1" 2>/dev/null || true
}

wait_for_http() {
  local label="$1"
  local url="$2"
  local code=""
  for _ in {1..30}; do
    code=$(http_code "$url")
    if [ "$code" = "200" ]; then
      echo "$label HTTP: $code"
      return 0
    fi
    sleep 1
  done
  echo "$label HTTP: ${code:-000}"
  return 1
}

echo "=== Starting Service Job Platform ==="
echo "Frontend: http://$HOST:$FRONTEND_PORT"
echo "Backend:  http://$HOST:$BACKEND_PORT"

stop_project_port "frontend" "$FRONTEND_PORT"
stop_project_port "backend" "$BACKEND_PORT"

> "$PROJECT_DIR/frontend.log"
> "$PROJECT_DIR/backend.log"

BACKEND_START_PID=$(start_detached "$PROJECT_DIR/backend" "$PROJECT_DIR/backend.log" npm start)
echo "$BACKEND_START_PID" > "$PROJECT_DIR/backend.pid"
echo "Backend started with PID: $BACKEND_START_PID"

FRONTEND_START_PID=$(start_detached "$PROJECT_DIR/frontend" "$PROJECT_DIR/frontend.log" npm run dev)
echo "$FRONTEND_START_PID" > "$PROJECT_DIR/frontend.pid"
echo "Frontend started with PID: $FRONTEND_START_PID"

sleep 3

BACKEND_LISTEN=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
FRONTEND_LISTEN=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

if [ -n "$BACKEND_LISTEN" ]; then
  echo "$BACKEND_LISTEN" > "$PROJECT_DIR/backend.pid"
fi
if [ -n "$FRONTEND_LISTEN" ]; then
  echo "$FRONTEND_LISTEN" > "$PROJECT_DIR/frontend.pid"
fi

wait_for_http "Backend" "http://$HOST:$BACKEND_PORT/api/health"
wait_for_http "Frontend" "http://$HOST:$FRONTEND_PORT/"

echo "=== Startup Complete ==="
