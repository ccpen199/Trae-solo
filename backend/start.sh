#!/bin/bash
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

source ../.env

echo "Starting backend on port $BACKEND_PORT..."
rm -f ../backend.log
nohup node server.js </dev/null >../backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID
echo "Backend PID: $BACKEND_PID"

sleep 3

echo "Starting frontend on port $FRONTEND_PORT..."
rm -f ../frontend.log
nohup npx vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort </dev/null >../frontend.log 2>&1 &
FRONTEND_PID=$!
disown $FRONTEND_PID
echo "Frontend PID: $FRONTEND_PID"

sleep 5

echo ""
echo "=== Health Check ==="
BACKEND_PID_CHECK=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
FRONTEND_PID_CHECK=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

if [ -n "$BACKEND_PID_CHECK" ]; then
  echo "Backend: RUNNING (PID $BACKEND_PID_CHECK)"
else
  echo "Backend: NOT RUNNING"
  cat ../backend.log
fi

if [ -n "$FRONTEND_PID_CHECK" ]; then
  echo "Frontend: RUNNING (PID $FRONTEND_PID_CHECK)"
else
  echo "Frontend: NOT RUNNING"
  cat ../frontend.log
fi

echo ""
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health && echo ""
curl -s -o /dev/null -w "Frontend HTTP: %{http_code}\n" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/

echo ""
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT/"
