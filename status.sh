#!/bin/zsh
cd "$(dirname "$0")"

source .env

echo "=== Service Status ==="
echo ""
echo "Frontend (port $FRONTEND_PORT):"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$frontend_pid" ]; then
  echo "  ✅ Running (PID: $frontend_pid)"
  ps -p "$frontend_pid" -o stat=,cwd=
else
  echo "  ❌ Not running"
fi

echo ""
echo "Backend (port $BACKEND_PORT):"
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  echo "  ✅ Running (PID: $backend_pid)"
  ps -p "$backend_pid" -o stat=,cwd=
else
  echo "  ❌ Not running"
fi

echo ""
echo "=== Health Check ==="
if [ -n "$backend_pid" ]; then
  echo -n "Backend API: "
  curl -sS --max-time 3 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "FAILED"
fi

if [ -n "$frontend_pid" ]; then
  echo -n "Frontend page: "
  curl -I --max-time 3 "http://127.0.0.1:$FRONTEND_PORT/" 2>/dev/null | head -1 || echo "FAILED"
fi
