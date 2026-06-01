#!/bin/bash
# 婚庆供应商撮合平台 - 停止脚本
# 仅终止当前项目目录的进程，禁止全局kill

set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# 读取端口配置
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43471}
BACKEND_PORT=${BACKEND_PORT:-53471}

echo "==========================================="
echo "  停止服务"
echo "  项目目录: $PROJECT_DIR"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo "==========================================="

kill_by_port() {
  local port=$1
  local name=$2
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  
  if [ -z "$pid" ]; then
    echo "$name 端口 $port 无进程监听"
    return 0
  fi
  
  local cwd=$(lsof -p "$pid" 2>/dev/null | awk '$4=="cwd"{print $9}')
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  echo "$name PID: $pid"
  echo "  cwd: $cwd"
  echo "  cmd: $cmd"
  
  # 检查是否属于当前项目
  if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
    echo "  ✓ 归属当前项目，终止进程 $pid..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    # 确认是否停止
    if kill -0 "$pid" 2>/dev/null; then
      echo "  强制终止 $pid"
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "  ✓ 已终止"
  else
    echo "  ✗ 不属于当前项目，跳过"
    echo "    原因: cwd=$cwd 不是 $PROJECT_DIR"
  fi
}

echo ""
kill_by_port $FRONTEND_PORT "前端"
echo ""
kill_by_port $BACKEND_PORT "后端"

# 清理 PID 文件
rm -f "$PROJECT_DIR/frontend.pid" "$PROJECT_DIR/backend.pid" 2>/dev/null

echo ""
echo "==========================================="
echo "  服务已停止"
echo "==========================================="
