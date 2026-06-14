#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

FRONTEND_PORT="${FRONTEND_PORT:-49090}"
BACKEND_PORT="${BACKEND_PORT:-59090}"
HOST="${HOST:-127.0.0.1}"
BACKEND_SESSION="pinai_${PROJECT_NAME}_backend"
FRONTEND_SESSION="pinai_${PROJECT_NAME}_frontend"

pid_cwd() {
  local pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

stop_project_port() {
  local port="$1"
  local label="$2"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -z "$pid" ] && return 0

  local cwd
  cwd="$(pid_cwd "$pid")"
  case "$cwd" in
    "$PROJECT_DIR"|"$PROJECT_DIR"/*)
      kill "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.3
      done
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      echo "stopped stale $label pid $pid on port $port"
      ;;
    *)
      echo "$label port $port is occupied outside this project: pid=$pid cwd=${cwd:-unknown}" >&2
      return 1
      ;;
  esac
}

start_session() {
  local session="$1"
  local cwd="$2"
  local command="$3"
  "$TMUX_BIN" has-session -t "$session" >/dev/null 2>&1 && "$TMUX_BIN" kill-session -t "$session" || true
  "$TMUX_BIN" new-session -d -s "$session" -c "$cwd" /bin/zsh -lc "$command"
}

wait_http() {
  local name="$1"
  local url="$2"
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    local code
    code="$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url" || true)"
    if [ "$code" = "200" ]; then
      echo "$name HTTP 200"
      return 0
    fi
    sleep 1
  done
  echo "$name 未返回 200: $url"
  return 1
}

mkdir -p "$PROJECT_DIR/data"

stop_project_port "$FRONTEND_PORT" "frontend"
stop_project_port "$BACKEND_PORT" "backend"

COMMON_ENV="PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='$HOST' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' DB_PATH='data/app.sqlite' NODE_ENV='development'"

start_session "$BACKEND_SESSION" "$PROJECT_DIR/backend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/backend/server.js' > '$PROJECT_DIR/backend.log' 2>&1"
start_session "$FRONTEND_SESSION" "$PROJECT_DIR/frontend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/frontend/node_modules/vite/bin/vite.js' --host '$HOST' --port '$FRONTEND_PORT' --strictPort > '$PROJECT_DIR/frontend.log' 2>&1"

wait_http "后端" "http://127.0.0.1:$BACKEND_PORT/api/health"
wait_http "前端" "http://127.0.0.1:$FRONTEND_PORT/"

frontend_pid="$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
backend_pid="$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
if [ -n "$frontend_pid" ]; then
  printf '%s\n' "$frontend_pid" > "$PROJECT_DIR/frontend.pid"
  printf '%s\n' "$frontend_pid" > "$PROJECT_DIR/.frontend.pid"
fi
if [ -n "$backend_pid" ]; then
  printf '%s\n' "$backend_pid" > "$PROJECT_DIR/backend.pid"
  printf '%s\n' "$backend_pid" > "$PROJECT_DIR/.backend.pid"
fi

echo "启动完成"
echo "前端: http://127.0.0.1:$FRONTEND_PORT/"
echo "后端: http://127.0.0.1:$BACKEND_PORT"
