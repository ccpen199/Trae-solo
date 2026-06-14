#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

FRONTEND_PORT=${FRONTEND_PORT:-49078}
BACKEND_PORT=${BACKEND_PORT:-59078}
HOST=${HOST:-127.0.0.1}

echo "=========================================="
echo "Starting Recruitment Platform"
echo "=========================================="
echo "Frontend: http://$HOST:$FRONTEND_PORT"
echo "Backend:  http://$HOST:$BACKEND_PORT"
echo "=========================================="

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

# Cleanup old processes
stop_project_port "frontend" "$FRONTEND_PORT"
stop_project_port "backend" "$BACKEND_PORT"

> "$PROJECT_DIR/frontend.log"
> "$PROJECT_DIR/backend.log"

# Start Backend
echo ""
echo "Starting backend..."
cd "$PROJECT_DIR/backend"
BACKEND_PID=$(start_detached "$PROJECT_DIR/backend" "$PROJECT_DIR/backend.log" node dist/index.js)
echo "$BACKEND_PID" > "$PROJECT_DIR/backend.pid"
echo "Backend started with PID: $BACKEND_PID"

# Start Frontend
echo ""
echo "Starting frontend..."
cd "$PROJECT_DIR/frontend"
FRONTEND_PID=$(start_detached "$PROJECT_DIR/frontend" "$PROJECT_DIR/frontend.log" npm run dev)
echo "$FRONTEND_PID" > "$PROJECT_DIR/frontend.pid"
echo "Frontend started with PID: $FRONTEND_PID"

sleep 1

BACKEND_LISTEN=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$BACKEND_LISTEN" ]; then
  echo "$BACKEND_LISTEN" > "$PROJECT_DIR/backend.pid"
fi
FRONTEND_LISTEN=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$FRONTEND_LISTEN" ]; then
  echo "$FRONTEND_LISTEN" > "$PROJECT_DIR/frontend.pid"
fi

# Wait for services to start
echo ""
echo "Waiting for services to start..."
sleep 15

# Check services
echo ""
echo "=========================================="
echo "Service Status Check"
echo "=========================================="

# Check Backend
BACKEND_LISTEN=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$BACKEND_LISTEN" ]; then
  BACKEND_STAT=$(ps -o stat= -p $BACKEND_LISTEN 2>/dev/null | xargs)
  BACKEND_HEALTH=$(curl -sS --max-time 5 http://$HOST:$BACKEND_PORT/api/health 2>&1 || echo "FAILED")
  echo "✅ Backend:  OK (PID: $BACKEND_LISTEN, STAT: $BACKEND_STAT)"
  echo "   Health: $BACKEND_HEALTH"
else
  echo "❌ Backend:  FAILED - not listening on port $BACKEND_PORT"
fi

# Check Frontend
FRONTEND_LISTEN=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$FRONTEND_LISTEN" ]; then
  FRONTEND_STAT=$(ps -o stat= -p $FRONTEND_LISTEN 2>/dev/null | xargs)
  FRONTEND_HTTP=$(curl -I --max-time 5 http://$HOST:$FRONTEND_PORT/ 2>&1 | head -1 || echo "FAILED")
  echo "✅ Frontend: OK (PID: $FRONTEND_LISTEN, STAT: $FRONTEND_STAT)"
  echo "   HTTP: $FRONTEND_HTTP"
else
  echo "❌ Frontend: FAILED - not listening on port $FRONTEND_PORT"
fi

echo ""
echo "=========================================="
echo "Access URLs:"
echo "  Frontend: http://$HOST:$FRONTEND_PORT"
echo "  Backend:  http://$HOST:$BACKEND_PORT/api/health"
echo ""
echo "Default Accounts:"
echo "  admin / admin123   (管理员)"
echo "  hr / hr123456      (HR专员)"
echo "  manager / manager123 (部门经理)"
echo "  interviewer / interview123 (面试官)"
echo "=========================================="
echo "Logs:"
echo "  Backend: tail -f $PROJECT_DIR/backend.log"
echo "  Frontend: tail -f $PROJECT_DIR/frontend.log"
echo "=========================================="
