#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  source .env
else
  FRONTEND_PORT=43483
  BACKEND_PORT=53483
fi

process_cwd() {
  local pid=$1
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

stop_port() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$pid" ]; then
    echo "No process found on port $port"
    return 0
  fi
  
  local cwd=$(process_cwd "$pid")
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  case "$cwd" in
    "$PROJECT_DIR"*)
      echo "Killing process $pid on port $port (cwd: $cwd)"
      kill "$pid" 2>/dev/null || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -KILL "$pid" 2>/dev/null || true
      fi
      ;;
    *)
      echo "Skip killing process $pid on port $port (cwd: $cwd, cmd: $cmd) - does not belong to this project"
      ;;
  esac
}

echo "Stopping frontend (port $FRONTEND_PORT)..."
stop_port "$FRONTEND_PORT"

echo "Stopping backend (port $BACKEND_PORT)..."
stop_port "$BACKEND_PORT"

sleep 1

echo "Done!"
