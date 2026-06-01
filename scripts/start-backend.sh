#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

echo "=== Starting Backend ==="
echo "Project: $PROJECT_DIR"
echo "Backend port: $BACKEND_PORT"

echo "Checking port $BACKEND_PORT..."
existing_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$existing_pid" ]; then
  cwd=$(lsof -p "$existing_pid" | grep cwd | awk '{print $NF}' 2>/dev/null || true)
  cmd=$(ps -o command= -p "$existing_pid" 2>/dev/null || true)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "Killing existing backend process PID=$existing_pid (cwd=$cwd)"
      kill "$existing_pid"
      sleep 2
      ;;
    *)
      echo "Port $BACKEND_PORT occupied by non-project process, trying backup port..."
      BACKUP_PORT=$((51000 + 3487))
      for slot in 1 2 3 4 5; do
        test_port=$((50000 + slot * 1000 + 3487))
        test_pid=$(lsof -nP -iTCP:$test_port -sTCP:LISTEN -t | head -n1)
        if [ -z "$test_pid" ]; then
          BACKEND_PORT=$test_port
          sed -i.bak "s/BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" .env
          echo "Using backup backend port: $BACKEND_PORT"
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

cd "$PROJECT_DIR/backend"
nohup python3 -m uvicorn app.main:app \
  --host 127.0.0.1 \
  --port $BACKEND_PORT \
  --log-level info \
  > "$PROJECT_DIR/backend.log" 2>&1 &

BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
echo "Logs: $PROJECT_DIR/backend.log"

sleep 5

echo "Verifying backend..."
if lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN > /dev/null 2>&1; then
  echo "Backend port $BACKEND_PORT is listening"
  ps -o pid=,stat= -p $BACKEND_PID || true
  if curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
    echo "Backend health check: OK"
    echo "Backend URL: http://127.0.0.1:$BACKEND_PORT"
  else
    echo "WARNING: Backend health check failed"
    tail -20 "$PROJECT_DIR/backend.log"
  fi
else
  echo "ERROR: Backend port $BACKEND_PORT not listening"
  tail -50 "$PROJECT_DIR/backend.log"
  exit 1
fi

echo $BACKEND_PID > "$PROJECT_DIR/.backend.pid"
echo "=== Backend Started Successfully ==="
