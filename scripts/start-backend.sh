#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-59105}

pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
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

echo "Starting backend on port $BACKEND_PORT..."
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
[ -x "$NODE_BIN" ] || NODE_BIN="$(command -v node)"
"$NODE_BIN" --import tsx/esm api/server.ts > backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID 2>/dev/null || true
echo "Started with PID: $BACKEND_PID"

sleep 8

echo "=== Verification ==="
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
echo "Backend PID: $backend_pid"

if [ -z "$backend_pid" ]; then
  echo "ERROR: Backend not listening on port $BACKEND_PORT"
  echo "Log:"
  cat backend.log
  exit 1
fi

ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
stat=$(ps -o stat= -p "$backend_pid" | xargs)
echo "Process status: $stat"

if echo "$stat" | grep -q 'T'; then
  echo "ERROR: Process is stopped (T state)"
  exit 1
fi

if echo "$stat" | grep -q 'Z'; then
  echo "ERROR: Process is zombie (Z state)"
  exit 1
fi

echo "=== Health check ==="
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
echo ""

echo ""
echo "=== Login test ==="
curl -sS --max-time 5 -X POST http://127.0.0.1:$BACKEND_PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
echo ""

echo ""
echo "Backend started successfully!"
echo "URL: http://127.0.0.1:$BACKEND_PORT"
