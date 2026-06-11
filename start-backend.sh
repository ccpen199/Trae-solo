#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Kill existing processes on port 59105 belonging to this project
PORT=59105
pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$pid" ]; then
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  if echo "$cmd" | grep -q "api/server.ts" && [ "$cwd" = "$PROJECT_DIR" ]; then
    echo "Killing existing backend process: $pid"
    kill "$pid" 2>/dev/null || true
    sleep 2
  fi
fi
sleep 1

# Start backend server
echo "Starting backend server on port $PORT..."
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
PORT=59105 HOST=127.0.0.1 NODE_ENV=development "$NODE_BIN" --import tsx/esm api/server.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid
disown $BACKEND_PID 2>/dev/null || true

# Wait for server to start
sleep 6

# Verify server is running
backend_pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$backend_pid" ]; then
  echo "Backend server started successfully (PID: $backend_pid)"
  echo "http://127.0.0.1:$PORT"
  
  # Check process status
  stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  echo "Process status: $stat"
  
  # Check health endpoint
  response=$(curl -sS --max-time 5 http://127.0.0.1:$PORT/api/health 2>&1)
  echo "Health check: $response"
else
  echo "Failed to start backend server"
  echo "Log:"
  cat backend.log
  exit 1
fi
