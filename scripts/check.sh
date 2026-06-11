#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49100}
BACKEND_PORT=${BACKEND_PORT:-59100}

echo "=== Project Check ==="
echo "PROJECT_DIR=$PROJECT_DIR"
echo "FRONTEND_PORT=$FRONTEND_PORT"
echo "BACKEND_PORT=$BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "Frontend PID: ${frontend_pid:-none}"
echo "Backend PID:  ${backend_pid:-none}"
echo ""

if [ -n "$frontend_pid" ]; then
  echo "--- Frontend Process ---"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "Process not found"
  lsof -a -p "$frontend_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n/cwd=/p' | head -n1
fi
if [ -n "$backend_pid" ]; then
  echo "--- Backend Process ---"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "Process not found"
  lsof -a -p "$backend_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n/cwd=/p' | head -n1
fi

echo ""
echo "--- HTTP Checks ---"
if [ -n "$frontend_pid" ]; then
  echo "Frontend HTTP:"
  curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -5
else
  echo "Frontend: not running"
fi

if [ -n "$backend_pid" ]; then
  echo "Backend HTTP:"
  curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1 || echo "Health check failed"
else
  echo "Backend: not running"
fi
