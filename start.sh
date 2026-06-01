#!/bin/bash
cd "$(dirname "$0")"

source .env 2>/dev/null

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=${FRONTEND_PORT:-43426}
BACKEND_PORT=${BACKEND_PORT:-53426}

check_and_kill() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    case "$cwd" in
      "$PROJECT_DIR"/*) 
        echo "Killing PID $pid on port $port (project process)"
        kill "$pid" 2>/dev/null
        sleep 1
        ;;
      *)
        echo "Port $port occupied by non-project process (cwd=$cwd), skipping kill"
        return 1
        ;;
    esac
  fi
  return 0
}

check_port_free() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    echo "Port $port still occupied by PID $pid"
    return 1
  fi
  return 0
}

echo "=== Stopping existing processes ==="
check_and_kill $FRONTEND_PORT
check_and_kill $BACKEND_PORT

sleep 1

echo "=== Starting backend on port $BACKEND_PORT ==="
nohup node backend/server.js > backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID 2>/dev/null
echo "Backend PID: $BACKEND_PID"

echo "=== Starting frontend on port $FRONTEND_PORT ==="
nohup node_modules/.bin/vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > frontend.log 2>&1 &
FRONTEND_PID=$!
disown $FRONTEND_PID 2>/dev/null
echo "Frontend PID: $FRONTEND_PID"

echo "=== Waiting for services to start ==="
sleep 5

echo "=== Verifying backend ==="
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$backend_pid" ]; then
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null)
  echo "Backend PID: $backend_pid, Status: $backend_stat"
  health=$(curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>/dev/null)
  echo "Health: $health"
else
  echo "ERROR: Backend not listening on port $BACKEND_PORT"
  cat backend.log
fi

echo "=== Verifying frontend ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$frontend_pid" ]; then
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null)
  echo "Frontend PID: $frontend_pid, Status: $frontend_stat"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/)
  echo "Frontend HTTP: $http_code"
else
  echo "ERROR: Frontend not listening on port $FRONTEND_PORT"
  cat frontend.log
fi

echo ""
echo "=== Access URLs ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT/api/health"
