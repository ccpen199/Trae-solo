
#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43463}
BACKEND_PORT=${BACKEND_PORT:-53463}

echo "=========================================="
echo "  停止药品不良反应上报系统服务"
echo "=========================================="

kill_port_process() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    case "$cwd" in
      "$PROJECT_DIR"/*)
        echo "停止进程 (端口 $port): pid=$pid"
        echo "  cwd: $cwd"
        echo "  cmd: $cmd"
        kill "$pid" 2>/dev/null || true
        sleep 1
        # 确认已停止
        if kill -0 "$pid" 2>/dev/null; then
          echo "  强制停止进程..."
          kill -9 "$pid" 2>/dev/null || true
        fi
        echo "  已停止"
        ;;
      *)
        echo "跳过端口 $port 的进程: 不属于当前项目"
        echo "  cwd: $cwd"
        echo "  cmd: $cmd"
        ;;
    esac
  else
    echo "端口 $port 没有监听进程"
  fi
}

kill_port_process $FRONTEND_PORT
kill_port_process $BACKEND_PORT

echo ""
echo "服务已停止"
echo "=========================================="
