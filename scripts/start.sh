#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$PROJECT_DIR/scripts"
LOG_DIR="$PROJECT_DIR/logs"

source "$SCRIPT_DIR/process-common.sh"
load_env

"$SCRIPT_DIR/port-manager.sh" ensure

load_env

mkdir -p "$LOG_DIR"

echo "=== Starting project may-89096 ==="
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port: $BACKEND_PORT"

if check_port_listening "$FRONTEND_PORT"; then
  fpid=$(get_pid_by_port "$FRONTEND_PORT")
  if is_project_pid "$fpid"; then
    echo "Frontend already running on port $FRONTEND_PORT (pid $fpid)"
  else
    echo "Port $FRONTEND_PORT occupied by non-project process, trying next slot..."
    "$SCRIPT_DIR/port-manager.sh" ensure
    load_env
  fi
fi

if check_port_listening "$BACKEND_PORT"; then
  bpid=$(get_pid_by_port "$BACKEND_PORT")
  if is_project_pid "$bpid"; then
    echo "Backend already running on port $BACKEND_PORT (pid $bpid)"
  else
    echo "Port $BACKEND_PORT occupied by non-project process, trying next slot..."
    "$SCRIPT_DIR/port-manager.sh" ensure
    load_env
  fi
fi

echo ""
echo "Starting backend..."
if [ -f "$PROJECT_DIR/api/server.ts" ]; then
  cd "$PROJECT_DIR"
  nohup npm run server:dev > "$LOG_DIR/backend.log" 2>&1 &
  echo "Backend started (Express + TypeScript)"
else
  echo "WARN: No backend start configuration found"
fi

echo ""
echo "Starting frontend..."
if [ -f "$PROJECT_DIR/package.json" ] && [ -d "$PROJECT_DIR/src" ]; then
  cd "$PROJECT_DIR"
  nohup npm run client:dev > "$LOG_DIR/frontend.log" 2>&1 &
  echo "Frontend started (Vite + React)"
else
  echo "WARN: No frontend start configuration found"
fi

echo ""
echo "Waiting 5 seconds for services to start..."
sleep 5

echo ""
echo "=== Service Verification ==="
"$SCRIPT_DIR/health-check.sh"

echo ""
echo "=== Access URLs ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "API:      http://127.0.0.1:$BACKEND_PORT/api"
echo "Health:   http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "Logs:"
echo "Frontend: $LOG_DIR/frontend.log"
echo "Backend:  $LOG_DIR/backend.log"
