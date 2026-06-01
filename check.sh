#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env

echo "============================================"
echo "  Project Status Check"
echo "============================================"
echo ""

echo "Project directory: $PROJECT_DIR"
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port:  $BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

process_cwd() {
  local pid=$1
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

echo "Frontend process:"
if [ -n "$frontend_pid" ]; then
  echo "  PID: $frontend_pid"
  echo "  CWD: $(process_cwd "$frontend_pid")"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  Process $frontend_pid not found"
else
  echo "  Not running"
fi

echo ""
echo "Backend process:"
if [ -n "$backend_pid" ]; then
  echo "  PID: $backend_pid"
  echo "  CWD: $(process_cwd "$backend_pid")"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  Process $backend_pid not found"
else
  echo "  Not running"
fi

echo ""
echo "Frontend HTTP check:"
curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -n1 || echo "  Failed"

echo ""
echo "Backend health check:"
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" || echo "  Failed"

echo ""
echo "============================================"
