#!/bin/bash
set -e

cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

source .env

echo "=== Parcel Platform Health Check ==="
echo "Project: $PROJECT_DIR"
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port: $BACKEND_PORT"
echo ""

get_cwd() {
  local pid=$1
  lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-
}

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "--- Frontend ---"
if [ -n "$frontend_pid" ]; then
  echo "PID: $frontend_pid"
  frontend_cwd=$(get_cwd "$frontend_pid")
  echo "CWD: $frontend_cwd"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  echo "Status: $frontend_stat"
  if [[ "$frontend_stat" == *"T"* ]] || [[ "$frontend_stat" == *"Z"* ]]; then
    echo "ERROR: Frontend process is in bad state: $frontend_stat"
    exit 1
  fi
  echo "HTTP check..."
  curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -n5
else
  echo "ERROR: Frontend not listening on port $FRONTEND_PORT"
  exit 1
fi

echo ""
echo "--- Backend ---"
if [ -n "$backend_pid" ]; then
  echo "PID: $backend_pid"
  backend_cwd=$(get_cwd "$backend_pid")
  echo "CWD: $backend_cwd"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  echo "Status: $backend_stat"
  if [[ "$backend_stat" == *"T"* ]] || [[ "$backend_stat" == *"Z"* ]]; then
    echo "ERROR: Backend process is in bad state: $backend_stat"
    exit 1
  fi
  echo "API health check..."
  curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
  echo ""
else
  echo "ERROR: Backend not listening on port $BACKEND_PORT"
  exit 1
fi

echo ""
echo "=== All checks passed ==="
