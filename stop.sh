#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  source .env
fi

FRONTEND_PORT=${FRONTEND_PORT:-43451}
BACKEND_PORT=${BACKEND_PORT:-53451}

echo "=== Stopping Food Safety Traceability System ==="
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port: $BACKEND_PORT"

port_pid() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n1
}

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | awk '/^n/ { sub(/^n/, ""); print; exit }'
}

pid_in_project() {
  local pid=$1
  local cwd
  cwd=$(pid_cwd "$pid")
  [ "$cwd" = "$PROJECT_DIR" ] || [[ "$cwd" == "$PROJECT_DIR"/* ]]
}

stop_pid() {
  local pid=$1
  local label=$2
  if [ -z "$pid" ] || ! ps -p "$pid" >/dev/null 2>&1; then
    return 0
  fi

  local cwd
  local cmd
  cwd=$(pid_cwd "$pid")
  cmd=$(ps -p "$pid" -o command= 2>/dev/null)
  if pid_in_project "$pid"; then
    echo "Killing $label PID $pid (cwd=$cwd)"
    kill "$pid" 2>/dev/null || true
  else
    echo "SKIP kill: $label PID=$pid cwd=$cwd cmd=$cmd (not project dir)"
  fi
}

stop_port() {
  local port=$1
  local pid
  pid=$(port_pid "$port")
  if [ -z "$pid" ]; then
    echo "Port $port: no process listening"
    return 0
  fi

  local cwd
  local cmd
  cwd=$(pid_cwd "$pid")
  cmd=$(ps -p "$pid" -o command= 2>/dev/null)
  if pid_in_project "$pid"; then
    echo "Killing PID $pid on port $port (cwd=$cwd)"
    kill "$pid" 2>/dev/null || true
  else
    echo "SKIP kill: PID=$pid cwd=$cwd cmd=$cmd (not project dir)"
  fi
}

stop_pid "$(cat frontend.pid 2>/dev/null || true)" "frontend"
stop_pid "$(cat backend.pid 2>/dev/null || true)" "backend"
sleep 1

stop_port "$FRONTEND_PORT"
stop_port "$BACKEND_PORT"

sleep 2

echo ""
echo "=== Verification ==="
frontend_pid=$(port_pid "$FRONTEND_PORT")
backend_pid=$(port_pid "$BACKEND_PORT")

if [ -z "$frontend_pid" ] && [ -z "$backend_pid" ]; then
  echo "All services stopped successfully."
else
  [ -n "$frontend_pid" ] && echo "WARNING: Frontend still on port $FRONTEND_PORT (PID=$frontend_pid)"
  [ -n "$backend_pid" ] && echo "WARNING: Backend still on port $BACKEND_PORT (PID=$backend_pid)"
fi
