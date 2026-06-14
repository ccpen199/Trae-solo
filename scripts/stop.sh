#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

kill_project_pid() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  
  if [ -z "$pid" ]; then
    echo "No process found on port $port"
    return 0
  fi
  
  local cwd=$(lsof -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^p/ {p=substr($0,2)} /^n/ && p=='"$pid"' {print substr($0,2); exit}')
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  case "$cwd" in
    "$PROJECT_DIR"*)
      echo "Killing PID $pid (cwd=$cwd) on port $port"
      kill "$pid" 2>/dev/null || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      ;;
    *)
      echo "Skip kill: PID $pid on port $port does not belong to current project"
      echo "  cwd=$cwd"
      echo "  cmd=$cmd"
      ;;
  esac
}

echo "Stopping frontend (port $FRONTEND_PORT)..."
kill_project_pid "$FRONTEND_PORT"

echo "Stopping backend (port $BACKEND_PORT)..."
kill_project_pid "$BACKEND_PORT"

echo "All services stopped."
