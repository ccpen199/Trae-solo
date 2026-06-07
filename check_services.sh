#!/bin/zsh
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=49057
BACKEND_PORT=59057
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
echo "=== Frontend Status ==="
echo "Frontend PID: $frontend_pid"
if [ -n "$frontend_pid" ]; then
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
  ps -o stat= -p "$frontend_pid"
  curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/
fi
echo ""
echo "=== Backend Status ==="
echo "Backend PID: $backend_pid"
if [ -n "$backend_pid" ]; then
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
  ps -o stat= -p "$backend_pid"
  curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
fi
