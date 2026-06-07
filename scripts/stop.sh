#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

tmux kill-session -t may-88935-frontend >/dev/null 2>&1 || true
tmux kill-session -t may-88935-backend >/dev/null 2>&1 || true

kill_port() {
  local PORT=$1
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  
  if [ -z "$pid" ]; then
    echo "Port $PORT is not in use"
    return 0
  fi
  
  local cwd=$(lsof -p "$pid" -d cwd -F n 2>/dev/null | grep '^n' | sed 's/^n//' | head -1)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  local has_project_files=0
  if lsof -p "$pid" 2>/dev/null | grep -Fq "$PROJECT_DIR"; then
    has_project_files=1
  fi
  
  echo "Port $PORT PID=$pid"
  echo "  CWD: $cwd"
  echo "  CMD: $cmd"
  
  if [[ "$cwd" == "$PROJECT_DIR"* ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]] || [ "$has_project_files" = "1" ]; then
    echo "  Killing PID $pid (belongs to this project)"
    kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      echo "  Force killing PID $pid"
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "  Done"
  else
    echo "  SKIP: Process does not belong to this project"
  fi
}

echo "Stopping frontend (port $FRONTEND_PORT)..."
kill_port $FRONTEND_PORT

echo ""
echo "Stopping backend (port $BACKEND_PORT)..."
kill_port $BACKEND_PORT

echo ""
echo "Checking for additional slots..."
TAIL4="8935"
for slot in 1 2 3 4 5; do
  fp=$((40000 + slot * 1000 + TAIL4))
  bp=$((50000 + slot * 1000 + TAIL4))
  kill_port $fp
  kill_port $bp
done

echo ""
echo "All services stopped."
