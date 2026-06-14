#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

kill_port_process() {
  local PORT=$1
  local NAME=$2
  pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    echo "$NAME port $PORT: no process running"
    return
  fi
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "")
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  case "$cwd" in
    "$PROJECT_DIR"*)
      echo "Killing $NAME (PID=$pid, port=$PORT) - belongs to this project"
      kill "$pid"
      sleep 1
      # Force kill if still running
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      ;;
    *)
      echo "SKIP: $NAME port $PORT (PID=$pid) belongs to cwd=$cwd, not $PROJECT_DIR"
      echo "  Command: $cmd"
      ;;
  esac
}

echo "=== Stopping services ==="
kill_port_process "$FRONTEND_PORT" "Frontend"
kill_port_process "$BACKEND_PORT" "Backend"

echo ""
echo "=== Status ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
[ -z "$frontend_pid" ] && echo "Frontend port $FRONTEND_PORT: free" || echo "Frontend port $FRONTEND_PORT: still running PID $frontend_pid"
[ -z "$backend_pid" ] && echo "Backend port $BACKEND_PORT: free" || echo "Backend port $BACKEND_PORT: still running PID $backend_pid"
