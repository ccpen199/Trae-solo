#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43447}
BACKEND_PORT=${BACKEND_PORT:-53447}

stop_port() {
  local PORT=$1
  local NAME=$2
  local PID
  PID=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
  if [ -z "$PID" ]; then
    echo "$NAME 端口 $PORT 未监听"
    return 0
  fi
  local CWD
  CWD=$(lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  case "$CWD" in
    "$PROJECT_DIR"*)
      echo "停止 $NAME PID=$PID"
      kill "$PID" 2>/dev/null || true
      ;;
    *)
      echo "跳过 $NAME PID=$PID，不属于当前项目: $CWD"
      ;;
  esac
}

tmux kill-session -t "$(basename "$PROJECT_DIR")-frontend" 2>/dev/null || true
tmux kill-session -t "$(basename "$PROJECT_DIR")-backend" 2>/dev/null || true
stop_port "$FRONTEND_PORT" "前端"
stop_port "$BACKEND_PORT" "后端"
