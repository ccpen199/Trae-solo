#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
NODE_BIN="$(command -v node)"

if [ -x "/Users/chen/.nvm/versions/node/v22.22.0/bin/node" ]; then
  NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

FRONTEND_PORT="${FRONTEND_PORT:-50065}"
BACKEND_PORT="${BACKEND_PORT:-59065}"
API_BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"
VITE_API_BASE_URL="$API_BASE_URL"

write_env_ports() {
  local tmp="$ENV_FILE.tmp"
  touch "$ENV_FILE"
  awk -v fp="$FRONTEND_PORT" -v bp="$BACKEND_PORT" '
    BEGIN { seen_frontend = 0; seen_backend = 0; seen_api = 0; seen_vite_api = 0 }
    /^FRONTEND_PORT=/ { print "FRONTEND_PORT=" fp; seen_frontend = 1; next }
    /^BACKEND_PORT=/ { print "BACKEND_PORT=" bp; seen_backend = 1; next }
    /^API_BASE_URL=/ { print "API_BASE_URL=http://127.0.0.1:" bp "/api"; seen_api = 1; next }
    /^VITE_API_BASE_URL=/ { print "VITE_API_BASE_URL=http://127.0.0.1:" bp "/api"; seen_vite_api = 1; next }
    { print }
    END {
      if (!seen_frontend) print "FRONTEND_PORT=" fp
      if (!seen_backend) print "BACKEND_PORT=" bp
      if (!seen_api) print "API_BASE_URL=http://127.0.0.1:" bp "/api"
      if (!seen_vite_api) print "VITE_API_BASE_URL=http://127.0.0.1:" bp "/api"
    }
  ' "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
}

port_pid() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true
}

pid_in_project() {
  local pid="$1"
  local cwd cmd
  [ -n "$pid" ] || return 1
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^n/ {print substr($0, 2); exit}')"
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  case "$cwd" in
    "$PROJECT_DIR"|"$PROJECT_DIR"/*) return 0 ;;
  esac
  case "$cmd" in
    *"$PROJECT_DIR"*) return 0 ;;
  esac
  return 1
}

stop_project_pid() {
  local pid="$1"
  [ -n "$pid" ] || return 0
  ps -p "$pid" >/dev/null 2>&1 || return 0
  pid_in_project "$pid" || return 1
  kill "$pid" 2>/dev/null || true
  for _ in {1..20}; do
    ps -p "$pid" >/dev/null 2>&1 || return 0
    sleep 0.25
  done
  pid_in_project "$pid" && kill -9 "$pid" 2>/dev/null || true
}

wait_for_http() {
  local url="$1"
  for _ in {1..40}; do
    if curl -sS --max-time 1 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

start_detached() {
  local name="$1"
  local cwd="$2"
  local log="$3"
  shift 3

  if command -v screen >/dev/null 2>&1; then
    screen -dmS "$name" bash -lc 'cd "$1"; log="$2"; shift 2; exec "$@" > "$log" 2>&1' _ "$cwd" "$log" "$@"
  else
    (cd "$cwd" && nohup "$@" > "$log" 2>&1 < /dev/null &)
  fi
}

write_env_ports

for pid_file in "$PROJECT_DIR/frontend.pid" "$PROJECT_DIR/backend.pid"; do
  if [ -f "$pid_file" ]; then
    stop_project_pid "$(cat "$pid_file" 2>/dev/null || true)" || true
  fi
done

for port in "$FRONTEND_PORT" "$BACKEND_PORT" 49065 59065 60065; do
  pid="$(port_pid "$port")"
  if [ -n "$pid" ]; then
    stop_project_pid "$pid" || true
  fi
done

: > "$PROJECT_DIR/backend.log"
: > "$PROJECT_DIR/frontend.log"

echo "Starting backend on http://127.0.0.1:$BACKEND_PORT"
start_detached "may-89065-backend" "$PROJECT_DIR/backend" "$PROJECT_DIR/backend.log" \
  env \
  PATH="$(dirname "$NODE_BIN"):$PATH" \
  FRONTEND_PORT="$FRONTEND_PORT" \
  BACKEND_PORT="$BACKEND_PORT" \
  API_BASE_URL="$API_BASE_URL" \
  VITE_API_BASE_URL="$VITE_API_BASE_URL" \
  "$NODE_BIN" server.js

wait_for_http "http://127.0.0.1:$BACKEND_PORT/api/health"
port_pid "$BACKEND_PORT" > "$PROJECT_DIR/backend.pid"

echo "Starting frontend on http://127.0.0.1:$FRONTEND_PORT"
start_detached "may-89065-frontend" "$PROJECT_DIR/frontend" "$PROJECT_DIR/frontend.log" \
  env \
  PATH="$(dirname "$NODE_BIN"):$PATH" \
  FRONTEND_PORT="$FRONTEND_PORT" \
  BACKEND_PORT="$BACKEND_PORT" \
  API_BASE_URL="$API_BASE_URL" \
  VITE_API_BASE_URL="$VITE_API_BASE_URL" \
  npm run dev

wait_for_http "http://127.0.0.1:$FRONTEND_PORT/"
port_pid "$FRONTEND_PORT" > "$PROJECT_DIR/frontend.pid"

echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
