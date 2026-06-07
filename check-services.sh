#!/bin/zsh
cd "$(dirname "$0")"
source .env
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=49058
BACKEND_PORT=59058

echo "=== Checking Frontend ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
echo "Frontend PID: $frontend_pid"
if [ -n "$frontend_pid" ]; then
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,comm=
  frontend_cwd=$(lsof -p "$frontend_pid" 2>/dev/null | grep cwd | awk '{print $NF}')
  frontend_cmd=$(ps -o command= -p "$frontend_pid")
  echo "cwd: $frontend_cwd"
  echo "cmd: $frontend_cmd"
fi

echo ""
echo "=== Checking Backend ==="
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
echo "Backend PID: $backend_pid"
if [ -n "$backend_pid" ]; then
  ps -p "$backend_pid" -o pid=,ppid=,stat=,comm=
  backend_cwd=$(lsof -p "$backend_pid" 2>/dev/null | grep cwd | awk '{print $NF}')
  backend_cmd=$(ps -o command= -p "$backend_pid")
  echo "cwd: $backend_cwd"
  echo "cmd: $backend_cmd"
fi

echo ""
echo "=== Frontend HTTP ==="
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -10

echo ""
echo "=== Backend API Health ==="
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1

echo ""
echo "=== Backend API Lives ==="
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/lives 2>&1 | head -5
