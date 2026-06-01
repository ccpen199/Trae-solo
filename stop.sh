#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

read_env() {
  local env_file="$PROJECT_DIR/.env"
  if [ -f "$env_file" ]; then
    while IFS='=' read -r key value; do
      case "$key" in
        \#* | '') continue ;;
      esac
      key=$(echo "$key" | xargs)
      value=$(echo "$value" | xargs | sed -e 's/^"//' -e 's/"$//')
      export "$key=$value"
    done < "$env_file"
  fi
}

read_env

FRONTEND_PORT="${FRONTEND_PORT:-43453}"
BACKEND_PORT="${BACKEND_PORT:-53453}"

stop_project_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
  if [ -z "$pid" ]; then
    echo "No listener on port $port"
    return 0
  fi

  local cwd
  local cmd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 | xargs)"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"

  echo "Port $port has listener PID $pid"
  echo "  cwd=$cwd"
  echo "  cmd=$cmd"

  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "Stopping PID $pid on port $port (belongs to this project)"
      kill "$pid" 2>/dev/null || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        echo "  Force killing PID $pid"
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
      fi
      if [ -f "$PROJECT_DIR/backend.pid" ] && [ "$(cat "$PROJECT_DIR/backend.pid")" = "$pid" ]; then
        rm -f "$PROJECT_DIR/backend.pid"
      fi
      if [ -f "$PROJECT_DIR/frontend.pid" ] && [ "$(cat "$PROJECT_DIR/frontend.pid")" = "$pid" ]; then
        rm -f "$PROJECT_DIR/frontend.pid"
      fi
      ;;
    *)
      echo "Skipping PID $pid on port $port because it is outside $PROJECT_DIR"
      echo "This process does not belong to this project and will not be killed"
      ;;
  esac
}

echo "=== Stopping Training Center Management System"
echo "Project dir: $PROJECT_DIR"
echo ""

echo "Stopping frontend on port $FRONTEND_PORT..."
stop_project_port "$FRONTEND_PORT"
echo ""

echo "Stopping backend on port $BACKEND_PORT..."
stop_project_port "$BACKEND_PORT"
echo ""

echo "Cleaning up PID files..."
rm -f "$PROJECT_DIR/frontend.pid"
rm -f "$PROJECT_DIR/backend.pid"

echo ""
echo "=== Stop Complete ==="
echo "Services have been stopped for project may-63453"
