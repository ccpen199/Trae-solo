#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-50105}

pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$pid" ]; then
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  if echo "$cmd" | grep -q "vite" && [ "$cwd" = "$PROJECT_DIR" ]; then
    echo "Killing existing frontend process: $pid"
    kill "$pid" 2>/dev/null || true
    sleep 2
  fi
fi

echo "Starting frontend on port $FRONTEND_PORT..."
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
[ -x "$NODE_BIN" ] || NODE_BIN="$(command -v node)"
"$NODE_BIN" node_modules/vite/bin/vite.js --strictPort --host 127.0.0.1 --port $FRONTEND_PORT > frontend.log 2>&1 &
FRONTEND_PID=$!
disown $FRONTEND_PID 2>/dev/null || true
echo "Started with PID: $FRONTEND_PID"

sleep 8

echo "=== Verification ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
echo "Frontend PID: $frontend_pid"

if [ -z "$frontend_pid" ]; then
  echo "ERROR: Frontend not listening on port $FRONTEND_PORT"
  echo "Log:"
  cat frontend.log
  exit 1
fi

ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
stat=$(ps -o stat= -p "$frontend_pid" | xargs)
echo "Process status: $stat"

echo "=== HTTP check ==="
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -5

echo ""
echo "Frontend started successfully!"
echo "URL: http://127.0.0.1:$FRONTEND_PORT"
