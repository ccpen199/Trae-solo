#!/bin/bash
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=49059
BACKEND_PORT=59059

get_pid_cwd() {
  local pid=$1
  lsof -p "$pid" -d cwd -a 2>/dev/null | grep -v COMMAND | awk '{print $9}'
}

safe_kill_port() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(get_pid_cwd "$pid")
    case "$cwd" in
      "$PROJECT_DIR"*)
        echo "Killing PID $pid on port $port (cwd=$cwd)"
        kill "$pid" 2>/dev/null
        sleep 1
        kill -9 "$pid" 2>/dev/null
        ;;
      *)
        echo "Skip PID $pid on port $port (cwd=$cwd not in $PROJECT_DIR)"
        ;;
    esac
  fi
}

echo "Stopping services for $PROJECT_DIR"
safe_kill_port $FRONTEND_PORT
safe_kill_port $BACKEND_PORT

sleep 1

# Also kill any remaining nodemon/vite from this project
for pid in $(pgrep -f "nodemon\|vite" 2>/dev/null); do
  cwd=$(get_pid_cwd "$pid")
  case "$cwd" in
    "$PROJECT_DIR"*)
      echo "Killing leftover process $pid (cwd=$cwd)"
      kill -9 "$pid" 2>/dev/null
      ;;
  esac
done

echo "Done. Ports check:"
lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN 2>/dev/null || echo "Port $FRONTEND_PORT free"
lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN 2>/dev/null || echo "Port $BACKEND_PORT free"
