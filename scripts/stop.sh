#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49097}
BACKEND_PORT=${BACKEND_PORT:-59097}

echo "=== 停止项目服务 ==="
echo "项目目录: $PROJECT_DIR"

safe_kill() {
  local port=$1
  local name=$2
  
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$pid" ]; then
    echo "$name 端口 $port 无进程监听"
    return 0
  fi
  
  local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  echo "$name 端口 $port, PID: $pid"
  echo "  CWD: $cwd"
  echo "  CMD: $cmd"
  
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "  归属确认，正在终止..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      
      local pid2=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
      if [ -n "$pid2" ]; then
        echo "  强制终止..."
        kill -9 "$pid2" 2>/dev/null || true
      fi
      echo "  ✓ 已终止"
      ;;
    *)
      echo "  ✗ 归属不明，跳过终止操作 (cwd=$cwd)"
      ;;
  esac
}

echo ""
safe_kill $FRONTEND_PORT "前端"
echo ""
safe_kill $BACKEND_PORT "后端"
echo ""
echo "=== 完成 ==="
