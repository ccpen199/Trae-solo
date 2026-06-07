#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"
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

FRONTEND_PORT="${FRONTEND_PORT:-49064}"
BACKEND_PORT="${BACKEND_PORT:-59064}"
LOG_FILE="$PROJECT_DIR/frontend.log"
PID_FILE="$PROJECT_DIR/frontend.pid"

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

for pid_file in "$PID_FILE"; do
  [ -f "$pid_file" ] && stop_project_pid "$(cat "$pid_file" 2>/dev/null || true)" || true
done

pid="$(port_pid "$FRONTEND_PORT")"
[ -n "$pid" ] && stop_project_pid "$pid" || true

: > "$LOG_FILE"

if command -v screen >/dev/null 2>&1; then
  screen -dmS may-89064-frontend bash -lc 'cd "$1"; log="$2"; shift 2; exec "$@" > "$log" 2>&1' _ "$FRONTEND_DIR" "$LOG_FILE" env PATH="$(dirname "$NODE_BIN"):$PATH" FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" "$FRONTEND_DIR/node_modules/.bin/vite" --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
else
  (cd "$FRONTEND_DIR" && nohup env PATH="$(dirname "$NODE_BIN"):$PATH" FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" "$FRONTEND_DIR/node_modules/.bin/vite" --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort > "$LOG_FILE" 2>&1 < /dev/null &)
fi

for _ in {1..40}; do
  pid="$(port_pid "$FRONTEND_PORT")"
  if [ -n "$pid" ] && pid_in_project "$pid" && curl -sS --max-time 1 "http://127.0.0.1:$FRONTEND_PORT/" >/dev/null 2>&1; then
    echo "$pid" > "$PID_FILE"
    echo "Frontend started on http://127.0.0.1:$FRONTEND_PORT with PID $pid"
    exit 0
  fi
  sleep 0.5
done

echo "Frontend failed to become ready on http://127.0.0.1:$FRONTEND_PORT" >&2
tail -n 80 "$LOG_FILE" >&2 || true
exit 1
