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

FRONTEND_PORT="${FRONTEND_PORT:-49089}"
BACKEND_PORT="${BACKEND_PORT:-59089}"
HOST="${HOST:-127.0.0.1}"
BACKEND_SESSION="pinai_${PROJECT_NAME}_backend"
FRONTEND_SESSION="pinai_${PROJECT_NAME}_frontend"

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

COMMON_ENV="PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='$HOST' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' DB_PATH='data/app.sqlite' NODE_ENV='development'"

start_session "$BACKEND_SESSION" "$PROJECT_DIR/backend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/backend/server.js' > '$PROJECT_DIR/backend.log' 2>&1"
start_session "$FRONTEND_SESSION" "$PROJECT_DIR/frontend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/frontend/static-server.js' > '$PROJECT_DIR/frontend.log' 2>&1"

wait_http "后端" "http://127.0.0.1:$BACKEND_PORT/api/health"
wait_http "前端" "http://127.0.0.1:$FRONTEND_PORT/"

echo "启动完成"
echo "前端: http://127.0.0.1:$FRONTEND_PORT/"
echo "后端: http://127.0.0.1:$BACKEND_PORT"
