#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43447}
BACKEND_PORT=${BACKEND_PORT:-53447}
TAIL4=$((BACKEND_PORT % 10000))
CURRENT_SLOT=$(((FRONTEND_PORT - 40000 - TAIL4) / 1000))
if [ "$CURRENT_SLOT" -lt 0 ]; then
  CURRENT_SLOT=0
fi

belongs_to_project() {
  local PID=$1
  local CWD
  CWD=$(lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  case "$CWD" in
    "$PROJECT_DIR"*) return 0 ;;
    *) return 1 ;;
  esac
}

port_available_or_reclaimed() {
  local PORT=$1
  local PID
  PID=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
  if [ -z "$PID" ]; then
    return 0
  fi
  if belongs_to_project "$PID"; then
    echo "端口 $PORT 被当前项目进程占用，终止 PID=$PID"
    kill "$PID" 2>/dev/null || true
    sleep 1
    return 0
  fi
  return 1
}

write_env_ports() {
  local FP=$1
  local BP=$2
  if [ ! -f .env ]; then
    touch .env
  fi
  if grep -q '^FRONTEND_PORT=' .env; then
    sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FP/" .env
  else
    echo "FRONTEND_PORT=$FP" >> .env
  fi
  if grep -q '^BACKEND_PORT=' .env; then
    sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$BP/" .env
  else
    echo "BACKEND_PORT=$BP" >> .env
  fi
}

for SLOT in 0 1 2 3 4 5; do
  if [ "$SLOT" -lt "$CURRENT_SLOT" ]; then
    continue
  fi
  CANDIDATE_FRONTEND=$((40000 + SLOT * 1000 + TAIL4))
  CANDIDATE_BACKEND=$((50000 + SLOT * 1000 + TAIL4))
  if port_available_or_reclaimed "$CANDIDATE_FRONTEND" && port_available_or_reclaimed "$CANDIDATE_BACKEND"; then
    FRONTEND_PORT=$CANDIDATE_FRONTEND
    BACKEND_PORT=$CANDIDATE_BACKEND
    write_env_ports "$FRONTEND_PORT" "$BACKEND_PORT"
    break
  fi
done

export FRONTEND_PORT BACKEND_PORT

launch_service() {
  local NAME=$1
  local WORK_DIR=$2
  local COMMAND=$3
  local LOG_FILE=$4
  local SESSION
  SESSION="$(basename "$PROJECT_DIR")-$NAME"
  : > "$LOG_FILE"
  if command -v tmux >/dev/null 2>&1; then
    tmux kill-session -t "$SESSION" 2>/dev/null || true
    tmux new-session -d -s "$SESSION" -c "$WORK_DIR" "exec $COMMAND >> '$LOG_FILE' 2>&1"
    echo "$NAME 会话: $SESSION"
  else
    (cd "$WORK_DIR" && nohup sh -c "exec $COMMAND" >> "$LOG_FILE" 2>&1 < /dev/null &)
    echo "$NAME PID: $!"
  fi
}

echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"

cd "$PROJECT_DIR/backend"
if [ ! -d node_modules ]; then
  npm install
fi
launch_service "backend" "$PROJECT_DIR/backend" "node server.js" "$PROJECT_DIR/backend.log"

cd "$PROJECT_DIR/frontend"
if [ ! -d node_modules ]; then
  npm install
fi
launch_service "frontend" "$PROJECT_DIR/frontend" "npx vite --host 127.0.0.1 --strictPort --port $FRONTEND_PORT" "$PROJECT_DIR/frontend.log"

sleep 4
"$PROJECT_DIR/scripts/check.sh"
