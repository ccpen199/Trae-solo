#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  if [ -x "$HOME/.nvm/versions/node/v22.22.0/bin/node" ]; then
    NODE_BIN="$HOME/.nvm/versions/node/v22.22.0/bin/node"
  else
    NODE_BIN="$(command -v node)"
  fi
fi

stop_from_pid_file() {
  local pid_file="$1"
  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL "$pid" 2>/dev/null || true
      sleep 1
    fi
  fi
}

process_cwd() {
  local pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

stop_project_port() {
  local port="$1"
  local label="$2"
  local pid
  local cwd

  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  if [ -z "$pid" ]; then
    return 0
  fi

  cwd="$(process_cwd "$pid")"
  case "$cwd" in
    "$PROJECT_DIR"*)
      echo "Stopping stale $label process $pid on port $port"
      kill "$pid" 2>/dev/null || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -KILL "$pid" 2>/dev/null || true
        sleep 1
      fi
      ;;
    *)
      echo "Error: port $port is occupied by pid $pid outside this project (cwd: ${cwd:-unknown})"
      exit 1
      ;;
  esac
}

stop_from_pid_file "$PROJECT_DIR/backend.pid"
stop_from_pid_file "$PROJECT_DIR/frontend.pid"
stop_project_port "$BACKEND_PORT" "backend"
stop_project_port "$FRONTEND_PORT" "frontend"

: > "$PROJECT_DIR/backend.log"
: > "$PROJECT_DIR/frontend.log"

echo "=== Starting backend..."
/usr/bin/python3 "$PROJECT_DIR/scripts/daemonize.py" \
  --cwd "$PROJECT_DIR/backend" \
  --env-file "$PROJECT_DIR/.env" \
  --pid-file "$PROJECT_DIR/backend.pid" \
  --log-file "$PROJECT_DIR/backend.log" \
  -- "$NODE_BIN" src/index.js
sleep 1
BACKEND_PID="$(cat "$PROJECT_DIR/backend.pid" 2>/dev/null || true)"
echo "Backend PID: ${BACKEND_PID:-unknown}"

echo "=== Starting frontend..."
/usr/bin/python3 "$PROJECT_DIR/scripts/daemonize.py" \
  --cwd "$PROJECT_DIR" \
  --env-file "$PROJECT_DIR/.env" \
  --pid-file "$PROJECT_DIR/frontend.pid" \
  --log-file "$PROJECT_DIR/frontend.log" \
  -- "$NODE_BIN" "$PROJECT_DIR/scripts/static-server.js"
sleep 2
FRONTEND_PID="$(cat "$PROJECT_DIR/frontend.pid" 2>/dev/null || true)"
echo "Frontend PID: ${FRONTEND_PID:-unknown}"

sleep 3

echo "=== Verification ==="
echo "Frontend URL: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend URL: http://127.0.0.1:$BACKEND_PORT"
