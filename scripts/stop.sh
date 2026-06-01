#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43448}
BACKEND_PORT=${BACKEND_PORT:-53448}

echo "========================================="
echo "停止项目服务"
echo "========================================="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

kill_process_by_port() {
  local PORT=$1
  local NAME=$2

  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)

  if [ -n "$pid" ]; then
    local cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)

    echo "检查 $NAME 进程 PID=$pid"
    echo "  cwd: $cwd"
    echo "  cmd: $cmd"

    case "$cwd" in
      "$PROJECT_DIR"/*)
        echo "  归属确认，正在终止..."
        kill "$pid" 2>/dev/null
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
          echo "  优雅停止失败，强制终止..."
          kill -9 "$pid" 2>/dev/null
        fi
        echo "  $NAME 已停止"
        ;;
      *)
        echo "  跳过终止: 进程不属于当前项目"
        echo "  建议: 手动检查该端口占用情况"
        ;;
    esac
  else
    echo "$NAME 端口 $PORT 未被占用"
  fi
  echo ""
}

tmux kill-session -t "$(basename "$PROJECT_DIR")-frontend" 2>/dev/null || true
tmux kill-session -t "$(basename "$PROJECT_DIR")-backend" 2>/dev/null || true
kill_process_by_port "$FRONTEND_PORT" "前端"
kill_process_by_port "$BACKEND_PORT" "后端"

echo "========================================="
echo "服务停止完成"
echo "========================================="
