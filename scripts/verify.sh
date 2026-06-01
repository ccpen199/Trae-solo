#!/bin/bash
# 婚庆供应商撮合平台 - 验收脚本
# 使用固定命令模板检查端口、进程、接口

set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# 读取端口配置
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43471}
BACKEND_PORT=${BACKEND_PORT:-53471}
HOST=${HOST:-127.0.0.1}

echo "==========================================="
echo "  服务验收检查"
echo "  项目: $PROJECT_DIR"
echo "  前端: http://$HOST:$FRONTEND_PORT"
echo "  后端: http://$HOST:$BACKEND_PORT"
echo "==========================================="

# 固定命令模板检查
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

echo ""
echo "--- 端口与进程检查 ---"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
echo "frontend_pid=$frontend_pid"
echo "backend_pid=$backend_pid"

ALL_OK=true

if [ -n "$frontend_pid" ]; then
  echo ""
  echo "--- 前端进程详情 ---"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "ps 查询失败"
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  if [[ "$frontend_stat" == *T* || "$frontend_stat" == *Z* || -z "$frontend_stat" ]]; then
    echo "❌ 前端进程异常: stat=$frontend_stat"
    ALL_OK=false
  else
    echo "✅ 前端进程状态正常: stat=$frontend_stat"
  fi
else
  echo "❌ 前端端口 $FRONTEND_PORT 无监听"
  ALL_OK=false
fi

if [ -n "$backend_pid" ]; then
  echo ""
  echo "--- 后端进程详情 ---"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "ps 查询失败"
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  if [[ "$backend_stat" == *T* || "$backend_stat" == *Z* || -z "$backend_stat" ]]; then
    echo "❌ 后端进程异常: stat=$backend_stat"
    ALL_OK=false
  else
    echo "✅ 后端进程状态正常: stat=$backend_stat"
  fi
else
  echo "❌ 后端端口 $BACKEND_PORT 无监听"
  ALL_OK=false
fi

echo ""
echo "--- HTTP 接口检查 ---"
echo ""
echo "[1/3] 前端首页..."
curl -I --max-time 5 "http://$HOST:$FRONTEND_PORT/" 2>&1 | head -5
if curl -sS --max-time 5 -I "http://$HOST:$FRONTEND_PORT/" 2>&1 | grep -q 'HTTP/.* 200'; then
  echo "✅ 前端首页返回 200"
else
  echo "❌ 前端首页未返回 200"
  ALL_OK=false
fi

echo ""
echo "[2/3] 后端健康接口..."
curl -sS --max-time 5 "http://$HOST:$BACKEND_PORT/api/health"
echo ""
if curl -sS --max-time 5 "http://$HOST:$BACKEND_PORT/api/health" 2>&1 | grep -q '"success":true'; then
  echo "✅ 后端健康接口正常"
else
  echo "❌ 后端健康接口异常"
  ALL_OK=false
fi

echo ""
echo "[3/3] 业务接口抽样检查..."
echo "--- /api/overview ---"
overview_result=$(curl -sS --max-time 5 "http://$HOST:$BACKEND_PORT/api/overview" 2>&1)
echo "$overview_result" | head -2
if echo "$overview_result" | grep -q '"success":true'; then
  echo "✅ 总览接口正常"
else
  echo "❌ 总览接口异常"
  ALL_OK=false
fi

echo "--- /api/requirements ---"
req_result=$(curl -sS --max-time 5 "http://$HOST:$BACKEND_PORT/api/requirements" 2>&1)
echo "$req_result" | head -2
if echo "$req_result" | grep -q '"success":true'; then
  echo "✅ 需求接口正常"
else
  echo "❌ 需求接口异常"
  ALL_OK=false
fi

echo "--- /api/suppliers ---"
sup_result=$(curl -sS --max-time 5 "http://$HOST:$BACKEND_PORT/api/suppliers" 2>&1)
echo "$sup_result" | head -2
if echo "$sup_result" | grep -q '"success":true'; then
  echo "✅ 供应商接口正常"
else
  echo "❌ 供应商接口异常"
  ALL_OK=false
fi

echo ""
echo "==========================================="
if [ "$ALL_OK" = true ]; then
  echo "  ✅ 所有检查通过，服务运行正常"
  echo "  前端访问: http://$HOST:$FRONTEND_PORT"
  echo "  后端API:  http://$HOST:$BACKEND_PORT/api"
else
  echo "  ❌ 部分检查未通过，请查看日志排查"
  echo "  前端日志: $PROJECT_DIR/frontend.log"
  echo "  后端日志: $PROJECT_DIR/backend.log"
  exit 1
fi
echo "==========================================="
