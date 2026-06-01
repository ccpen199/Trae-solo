#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source "$PROJECT_DIR/.env"

function kill_project_process() {
  local port=$1
  local name=$2
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    echo "ℹ️  $name port $port not in use"
    return
  fi
  local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "🛑 Stopping $name (PID=$pid, cwd=$cwd)"
      kill "$pid" 2>/dev/null || true
      sleep 2
      if kill -0 "$pid" 2>/dev/null; then
        echo "⚠️  Process still running, force killing..."
        kill -9 "$pid" 2>/dev/null || true
      fi
      echo "✅ $name stopped"
      ;;
    *)
      echo "⚠️  Skipping $name PID=$pid: cwd=$cwd not in project"
      echo "   Command: $cmd"
      ;;
  esac
}

echo "🔴 Stopping project services..."
echo ""

kill_project_process "$FRONTEND_PORT" "frontend"
kill_project_process "$BACKEND_PORT" "backend"

rm -f "$PROJECT_DIR/.frontend.pid" "$PROJECT_DIR/.backend.pid"

echo ""
echo "✅ All project services stopped."
