#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_PORT=46894
BACKEND_PORT=56894

echo "========================================"
echo "  Starting OTA Price Compare System"
echo "========================================"

kill_port_process() {
  local port=$1
  local pids=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null)
  for pid in $pids; do
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "")
    if echo "$cwd" | grep -q "^$PROJECT_DIR"; then
      echo "Killing project process PID $pid on port $port"
      kill $pid 2>/dev/null || true
    fi
  done
}

echo ""
echo "=== Cleaning up existing processes ==="
kill_port_process $FRONTEND_PORT
kill_port_process $BACKEND_PORT
sleep 2

echo ""
echo "=== Starting Backend ==="
cd "$PROJECT_DIR/backend"
nohup node src/server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started, PID: $BACKEND_PID"
sleep 3

if ! lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "ERROR: Backend failed to start!"
  cat "$PROJECT_DIR/backend.log"
  exit 1
fi
echo "Backend is running on port $BACKEND_PORT"

echo ""
echo "=== Starting Frontend ==="
cd "$PROJECT_DIR/frontend"
nohup npx vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started, PID: $FRONTEND_PID"
sleep 5

if ! lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "ERROR: Frontend failed to start!"
  cat "$PROJECT_DIR/frontend.log"
  exit 1
fi
echo "Frontend is running on port $FRONTEND_PORT"

echo ""
echo "========================================"
echo "  System Ready!"
echo "  Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT/"
echo "========================================"

sleep 2
echo ""
echo "=== Health Checks ==="
echo "Backend API: $(curl -sS http://127.0.0.1:$BACKEND_PORT/api/health 2>/dev/null)"
