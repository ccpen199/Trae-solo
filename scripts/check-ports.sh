#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49092}
BACKEND_PORT=${BACKEND_PORT:-59092}

echo "=== Port Check for $PROJECT_NAME"
echo "FRONTEND_PORT=$FRONTEND_PORT"
echo "BACKEND_PORT=$BACKEND_PORT"
echo ""

# Check frontend
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$frontend_pid" ]; then
  echo "FRONTEND: Port $FRONTEND_PORT is in use by PID $frontend_pid"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,args=
  frontend_cwd=$(lsof -a -p "$frontend_pid" -d cwd -Fn | grep '^n' | sed 's/^n//')
  echo "  cwd=$frontend_cwd"
else
  echo "FRONTEND: Port $FRONTEND_PORT is free"
fi

echo ""

# Check backend
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  echo "BACKEND: Port $BACKEND_PORT is in use by PID $backend_pid"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,args=
  backend_cwd=$(lsof -a -p "$backend_pid" -d cwd -Fn | grep '^n' | sed 's/^n//')
  echo "  cwd=$backend_cwd"
else
  echo "BACKEND: Port $BACKEND_PORT is free"
fi

echo ""
echo "=== Health Checks ==="

if [ -n "$frontend_pid" ]; then
  echo "Frontend HTTP response:"
  curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -5
fi

if [ -n "$backend_pid" ]; then
  echo ""
  echo "Backend API response:"
  curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1
  echo ""
fi
