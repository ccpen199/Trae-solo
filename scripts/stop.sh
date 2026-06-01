#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

# shellcheck disable=SC2046
export $(grep -v '^#' .env | xargs)

FRONTEND_PORT="${FRONTEND_PORT:-43420}"
BACKEND_PORT="${BACKEND_PORT:-53420}"

kill_process_by_port() {
  local port=$1
  local pid
  pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$pid" ]; then
    echo "No process found on port $port"
    return 0
  fi
  
  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "")
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  
  if [[ "$cwd" == "$PROJECT_DIR"/* ]]; then
    echo "Killing process on port $port (PID=$pid, cwd=$cwd)"
    kill "$pid" 2>/dev/null || true
    sleep 1
    
    if kill -0 "$pid" 2>/dev/null; then
      echo "Process still running, forcing kill..."
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "✅ Process on port $port killed"
  else
    echo "⚠️  Skipping kill: process on port $port (PID=$pid) does not belong to this project"
    echo "   cwd=$cwd"
    echo "   cmd=$cmd"
  fi
}

echo "Stopping services for project: $PROJECT_DIR"
echo "========================================"

echo "Stopping frontend (port $FRONTEND_PORT)..."
kill_process_by_port "$FRONTEND_PORT"

echo ""
echo "Stopping backend (port $BACKEND_PORT)..."
kill_process_by_port "$BACKEND_PORT"

echo ""
echo "========================================"
echo "Services stopped"
echo ""
echo "To verify, run: ./scripts/status.sh"
