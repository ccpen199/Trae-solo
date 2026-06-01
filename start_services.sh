
#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 加载 .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43463}
BACKEND_PORT=${BACKEND_PORT:-53463}
HOST=${HOST:-127.0.0.1}

echo "=========================================="
echo "  药品不良反应上报系统 - 服务启动脚本"
echo "=========================================="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo "绑定地址: $HOST"
echo ""

# 清理旧日志
rm -f backend.log frontend.log

# 杀掉属于当前项目的旧进程
cleanup_port() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    case "$cwd" in
      "$PROJECT_DIR"/*)
        echo "清理当前项目进程 (端口 $port): pid=$pid"
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
        ;;
      *)
        echo "警告: 端口 $port 被其他项目占用 (cwd=$cwd)，请检查!"
        ;;
    esac
  fi
}

cleanup_port $FRONTEND_PORT
cleanup_port $BACKEND_PORT

echo ""
echo "启动后端服务..."
cd "$PROJECT_DIR"
nohup npm run server:start > backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID 2>/dev/null || true
echo "后端服务 PID: $BACKEND_PID"

echo ""
echo "启动前端服务..."
nohup npm run client:dev > frontend.log 2>&1 &
FRONTEND_PID=$!
disown $FRONTEND_PID 2>/dev/null || true
echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "等待服务启动 (10 秒)..."
sleep 10

echo ""
echo "=========================================="
echo "  服务状态检查"
echo "=========================================="

# 检查端口
echo ""
echo "端口监听状态:"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
echo "  前端端口 $FRONTEND_PORT: ${frontend_pid:-未监听}"
echo "  后端端口 $BACKEND_PORT: ${backend_pid:-未监听}"

# 检查进程状态
echo ""
echo "进程状态:"
if [ -n "$frontend_pid" ]; then
  ps -p "$frontend_pid" -o pid=,stat=,cwd=,command= 2>/dev/null | head -1
fi
if [ -n "$backend_pid" ]; then
  ps -p "$backend_pid" -o pid=,stat=,cwd=,command= 2>/dev/null | head -1
fi

# HTTP 检查
echo ""
echo "HTTP 响应检查:"
if [ -n "$frontend_pid" ]; then
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ || echo "000")
  echo "  前端首页: HTTP $http_code"
fi
if [ -n "$backend_pid" ]; then
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health || echo "000")
  echo "  后端健康检查: HTTP $http_code"
  if [ "$http_code" = "200" ]; then
    echo "  健康检查响应: $(curl -s --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health)"
  fi
fi

echo ""
echo "=========================================="
echo "  访问地址"
echo "=========================================="
echo "  前端: http://127.0.0.1:$FRONTEND_PORT/"
echo "  后端 API: http://127.0.0.1:$BACKEND_PORT/api/"
echo "  后端日志: $PROJECT_DIR/backend.log"
echo "  前端日志: $PROJECT_DIR/frontend.log"
echo ""
echo "如需停止服务，运行: ./stop_services.sh"
echo "=========================================="
