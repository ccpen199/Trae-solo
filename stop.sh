#!/bin/bash
set -e

cd "$(dirname "$0")"
source .env

PROJECT_DIR="$(pwd)"
SESSION_PREFIX="$(basename "$PROJECT_DIR")"
FRONTEND_SESSION="$SESSION_PREFIX-frontend"
BACKEND_SESSION="$SESSION_PREFIX-backend"
echo "========================================"
echo "Crop Insurance System - Stop Script"
echo "========================================"
echo "Project: $PROJECT_DIR"
echo ""

stop_port_process() {
  local PORT=$1
  local NAME=$2
  
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
  
  if [ -n "$pid" ]; then
    local cwd=$(lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    
    echo "Checking $NAME (Port $PORT, PID $pid)..."
    echo "  CWD: $cwd"
    echo "  CMD: $cmd"
    
    case "$cwd" in
      "$PROJECT_DIR"|"$PROJECT_DIR"/*)
        echo "  Killing $NAME process (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 1
        
        if kill -0 "$pid" 2>/dev/null 2>&1; then
          echo "  Force killing..."
          kill -9 "$pid" 2>/dev/null || true
        fi
        echo "  $NAME stopped successfully"
        ;;
      *)
        echo "  SKIP: Process does not belong to this project"
        echo "  (CWD $cwd is not under $PROJECT_DIR)"
        ;;
    esac
  else
    echo "$NAME (Port $PORT): No process found"
  fi
}

stop_port_process $FRONTEND_PORT "Frontend"
echo ""
stop_port_process $BACKEND_PORT "Backend"

if command -v tmux >/dev/null 2>&1; then
  echo ""
  echo "Stopping project tmux sessions..."
  tmux kill-session -t "$FRONTEND_SESSION" 2>/dev/null || true
  tmux kill-session -t "$BACKEND_SESSION" 2>/dev/null || true
fi

echo ""
echo "========================================"
echo "Stop Complete!"
echo "========================================"
