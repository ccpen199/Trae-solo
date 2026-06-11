#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89081"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi

NODE22_BIN="$HOME/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

FRONTEND_PORT=${FRONTEND_PORT:-49081}
BACKEND_PORT=${BACKEND_PORT:-59081}
HOST=${HOST:-127.0.0.1}
CORS_ORIGIN=${CORS_ORIGIN:-http://127.0.0.1:$FRONTEND_PORT}
DATABASE_PATH=${DATABASE_PATH:-./data/app.sqlite}
VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api}
NODE_HOME=${NODE_HOME:-/Users/chen/.nvm/versions/node/v22.22.0}
export PATH="$NODE_HOME/bin:$PATH"
export FRONTEND_PORT BACKEND_PORT HOST CORS_ORIGIN DATABASE_PATH VITE_API_BASE_URL NODE_HOME

echo "=== Starting IR Remote Platform ==="
echo "Using Node: $(node -v) ($(command -v node))"

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
      echo "Killing existing $label PID: $pid"
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

stop_project_port "frontend" "$FRONTEND_PORT"
stop_project_port "backend" "$BACKEND_PORT"

# Clear logs
> "$PROJECT_DIR/frontend.log"
> "$PROJECT_DIR/backend.log"

# Start backend
echo "Starting backend..."
BACKEND_START_PID=$(start_detached "$PROJECT_DIR/backend" "$PROJECT_DIR/backend.log" node src/index.js)
echo "$BACKEND_START_PID" > "$PROJECT_DIR/backend.pid"
echo "Backend started with PID: $BACKEND_START_PID"

# Start frontend (redirect stdin to prevent TTY stops)
echo "Starting frontend..."
FRONTEND_START_PID=$(start_detached "$PROJECT_DIR/frontend" "$PROJECT_DIR/frontend.log" node node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort)
echo "$FRONTEND_START_PID" > "$PROJECT_DIR/frontend.pid"
echo "Frontend started with PID: $FRONTEND_START_PID"

# Wait for services to start
echo "Waiting 10 seconds for services to start..."
sleep 10

# Verify
echo ""
echo "=== Verification ==="
f_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
b_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "Frontend port $FRONTEND_PORT: ${f_pid:-NOT LISTENING}"
echo "Backend port $BACKEND_PORT: ${b_pid:-NOT LISTENING}"
if [ -n "$f_pid" ]; then
  echo "$f_pid" > "$PROJECT_DIR/frontend.pid"
fi
if [ -n "$b_pid" ]; then
  echo "$b_pid" > "$PROJECT_DIR/backend.pid"
fi

if [ -n "$f_pid" ] && [ -n "$b_pid" ]; then
  echo ""
  echo "Process status:"
  ps -p "$f_pid" -o pid=,stat=,command= 2>/dev/null || true
  ps -p "$b_pid" -o pid=,stat=,command= 2>/dev/null || true
  
  echo ""
  echo "HTTP checks:"
  frontend_ok=0
  backend_ok=0
  wait_for_http "Frontend" "http://127.0.0.1:$FRONTEND_PORT/" || frontend_ok=1
  wait_for_http "Backend" "http://127.0.0.1:$BACKEND_PORT/api/health" || backend_ok=1
  if [ "$frontend_ok" -ne 0 ] || [ "$backend_ok" -ne 0 ]; then
    echo ""
    echo "=== Startup FAILED ==="
    [ "$frontend_ok" -ne 0 ] && echo "Frontend HTTP check failed. Check frontend.log"
    [ "$backend_ok" -ne 0 ] && echo "Backend HTTP check failed. Check backend.log"
    exit 1
  fi
  
  echo ""
  echo "=== Startup Complete ==="
  echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
  echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
  echo "Logs: frontend.log, backend.log"
else
  echo ""
  echo "=== Startup FAILED ==="
  [ -z "$f_pid" ] && echo "Frontend failed to start. Check frontend.log"
  [ -z "$b_pid" ] && echo "Backend failed to start. Check backend.log"
  exit 1
fi
