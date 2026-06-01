#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43448}
BACKEND_PORT=${BACKEND_PORT:-53448}
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
  echo "端口 $PORT 被外部进程占用，尝试备用槽位"
  return 1
}

write_env_value() {
  local KEY=$1
  local VALUE=$2
  if grep -q "^$KEY=" .env; then
    sed -i '' "s#^$KEY=.*#$KEY=$VALUE#" .env
  else
    echo "$KEY=$VALUE" >> .env
  fi
}

write_env_ports() {
  local FP=$1
  local BP=$2
  if [ ! -f .env ]; then
    touch .env
  fi
  write_env_value "FRONTEND_PORT" "$FP"
  write_env_value "BACKEND_PORT" "$BP"
  write_env_value "API_BASE_URL" "http://127.0.0.1:$BP/api"
  write_env_value "VITE_API_BASE_URL" "http://127.0.0.1:$BP/api"
}

PORT_SELECTED=0
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
    PORT_SELECTED=1
    break
  fi
done

if [ "$PORT_SELECTED" -ne 1 ]; then
  echo "所有同项目端口槽位均不可用"
  exit 1
fi

export FRONTEND_PORT BACKEND_PORT
export API_BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"
export VITE_API_BASE_URL="$API_BASE_URL"

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

echo "========================================="
echo "启动项目服务"
echo "========================================="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"

cd "$PROJECT_DIR/backend"
if [ ! -d node_modules ]; then
  echo "后端依赖未安装，正在安装..."
  npm install
fi
if [ ! -f data/app.sqlite ]; then
  echo "数据库不存在，正在初始化..."
  node init-db.js
  node seed.js
else
  PLATFORM_COUNT=$(sqlite3 data/app.sqlite "SELECT COUNT(*) FROM platforms;" 2>/dev/null || echo "0")
  if [ "$PLATFORM_COUNT" = "0" ]; then
    echo "数据库无种子数据，正在补充..."
    node seed.js
  fi
fi

launch_service "backend" "$PROJECT_DIR/backend" "node server.js" "$PROJECT_DIR/backend.log"

cd "$PROJECT_DIR/frontend"
if [ ! -d node_modules ]; then
  echo "前端依赖未安装，正在安装..."
  npm install
fi
launch_service "frontend" "$PROJECT_DIR/frontend" "node server.js" "$PROJECT_DIR/frontend.log"

sleep 5
"$PROJECT_DIR/scripts/check.sh"

echo "前端访问地址: http://127.0.0.1:$FRONTEND_PORT/"
echo "后端健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
