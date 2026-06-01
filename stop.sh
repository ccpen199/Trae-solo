#!/bin/bash
# 机场行李追踪系统 - 停止脚本
# 只终止当前项目归属的进程，严格遵守进程隔离约束

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 加载环境变量
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43445}
BACKEND_PORT=${BACKEND_PORT:-53445}

echo "=========================================="
echo "机场行李追踪系统 - 停止脚本"
echo "=========================================="
echo ""
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

# 安全终止函数
safe_kill() {
  local PORT=$1
  local NAME=$2
  
  local PID=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$PID" ]; then
    echo "✓ $NAME 端口 $PORT 无进程监听"
    return 0
  fi
  
  local CWD=$(ps -o cwd= -p "$PID" | xargs 2>/dev/null || echo "")
  local CMD=$(ps -o command= -p "$PID" 2>/dev/null || echo "")
  
  echo "检查 $NAME 进程 (PID: $PID)..."
  echo "  CWD: $CWD"
  echo "  CMD: $CMD"
  
  # 严格检查：cwd 必须属于当前项目
  case "$CWD" in
    "$PROJECT_DIR"*)
      echo "  ✓ 确认属于当前项目，正在终止..."
      kill "$PID" 2>/dev/null || true
      sleep 1
      
      # 再次检查是否终止
      if lsof -nP -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  强制终止..."
        kill -9 "$PID" 2>/dev/null || true
        sleep 1
      fi
      
      if ! lsof -nP -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ✓ 已成功终止"
      else
        echo "  ✗ 终止失败，请手动处理"
      fi
      ;;
    *)
      echo "  ✗ 不属于当前项目，跳过终止（进程隔离约束）"
      echo "  如需终止该进程，请手动确认后执行: kill $PID"
      ;;
  esac
}

echo "停止前端服务..."
safe_kill $FRONTEND_PORT "前端"

echo ""
echo "停止后端服务..."
safe_kill $BACKEND_PORT "后端"

echo ""
echo "=========================================="
echo "停止完成！"
echo "=========================================="
echo ""
echo "当前端口状态："
echo "  前端 $FRONTEND_PORT: $(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 && echo '占用中' || echo '空闲')"
echo "  后端 $BACKEND_PORT: $(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 && echo '占用中' || echo '空闲')"
echo ""
