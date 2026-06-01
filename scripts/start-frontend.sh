#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

echo "=== Starting Frontend ==="
echo "Project: $PROJECT_DIR"
echo "Frontend port: $FRONTEND_PORT"

echo "Checking port $FRONTEND_PORT..."
existing_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$existing_pid" ]; then
  cwd=$(lsof -p "$existing_pid" | grep cwd | awk '{print $NF}' 2>/dev/null || true)
  cmd=$(ps -o command= -p "$existing_pid" 2>/dev/null || true)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "Killing existing frontend process PID=$existing_pid (cwd=$cwd)"
      kill "$existing_pid"
      sleep 2
      ;;
    *)
      echo "Port $FRONTEND_PORT occupied by non-project process, trying backup port..."
      for slot in 1 2 3 4 5; do
        test_port=$((40000 + slot * 1000 + 3487))
        test_pid=$(lsof -nP -iTCP:$test_port -sTCP:LISTEN -t | head -n1)
        if [ -z "$test_pid" ]; then
          FRONTEND_PORT=$test_port
          sed -i.bak "s/FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" .env
          echo "Using backup frontend port: $FRONTEND_PORT"
          break
        fi
      done
      if [ -z "$test_pid" ]; then
        echo "ERROR: All backup ports occupied"
        exit 1
      fi
      ;;
  esac
fi

cd "$PROJECT_DIR/frontend"
nohup npm run dev \
  -- --port $FRONTEND_PORT \
  > "$PROJECT_DIR/frontend.log" 2>&1 &

FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
echo "Logs: $PROJECT_DIR/frontend.log"

sleep 8

echo "Verifying frontend..."
if lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN > /dev/null 2>&1; then
  echo "Frontend port $FRONTEND_PORT is listening"
  ps -o pid=,stat= -p $FRONTEND_PID || true
  if curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | grep -q "HTTP/.* 200"; then
    echo "Frontend HTTP check: OK"
    echo "Frontend URL: http://127.0.0.1:$FRONTEND_PORT"
  else
    echo "WARNING: Frontend HTTP check failed"
    tail -30 "$PROJECT_DIR/frontend.log"
  fi
else
  echo "ERROR: Frontend port $FRONTEND_PORT not listening"
  tail -50 "$PROJECT_DIR/frontend.log"
  exit 1
fi

echo $FRONTEND_PID > "$PROJECT_DIR/.frontend.pid"
echo "=== Frontend Started Successfully ==="
