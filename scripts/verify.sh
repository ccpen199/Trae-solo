#!/bin/bash
set +e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

source "$ENV_FILE"

echo "========================================"
echo " 服务验证脚本"
echo "========================================"
echo ""

PROJECT_DIR="$(pwd)"

FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

print_process_info() {
  local pid=$1
  local cwd=""

  ps -p "$pid" -o pid=,ppid=,stat=,command= | sed 's/^/  /'
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  if [ -n "$cwd" ]; then
    echo "  cwd: $cwd"
  fi
}

echo "端口信息:"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo ""

if [ -n "$frontend_pid" ]; then
  echo "前端进程 (PID: $frontend_pid):"
  print_process_info "$frontend_pid"
else
  echo "前端: 无监听进程"
fi
echo ""

if [ -n "$backend_pid" ]; then
  echo "后端进程 (PID: $backend_pid):"
  print_process_info "$backend_pid"
else
  echo "后端: 无监听进程"
fi
echo ""

echo "HTTP 响应检查:"
echo "  前端首页:"
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -5 | sed 's/^/    /'
echo ""
echo "  后端健康检查:"
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 | sed 's/^/    /'
echo ""

if [ -n "$backend_pid" ] && [ -n "$frontend_pid" ]; then
  echo "  后端业务接口测试 (获取工人列表):"
  curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/workers?pageSize=3" 2>&1 | sed 's/^/    /'
  echo ""
  echo "  后端业务接口测试 (获取工种列表):"
  curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/trades?pageSize=5" 2>&1 | sed 's/^/    /'
  echo ""
  echo "  后端业务接口测试 (读取招工ID=1匹配结果):"
  curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/jobs/1/matches" 2>&1 | sed 's/^/    /'
fi

echo ""
echo "========================================"
echo "  验证完成"
echo "========================================"
