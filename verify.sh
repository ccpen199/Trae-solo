#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_PORT=49072
BACKEND_PORT=59072

echo "========================================"
echo "  四川政务服务平台 - 验收测试"
echo "========================================"
echo ""

echo "[1/5] 端口监听检查..."
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
echo "  前端端口 $FRONTEND_PORT: PID $frontend_pid"
echo "  后端端口 $BACKEND_PORT: PID $backend_pid"
echo ""

echo "[2/5] 进程状态检查..."
if [ -n "$frontend_pid" ]; then
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  echo "  前端进程状态: $frontend_stat"
fi
if [ -n "$backend_pid" ]; then
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  echo "  后端进程状态: $backend_stat"
fi
echo ""

echo "[3/5] HTTP 访问测试..."
echo "  前端首页:    $(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/)"
echo "  健康检查:    $(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health)"
echo "  热门服务:    $(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/service-items/hot)"
echo "  场景服务:    $(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/scenarios)"
echo "  政策解读:    $(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/policies)"
echo "  统计概览:    $(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/statistics/overview)"
echo ""

echo "[4/5] 访问地址..."
echo "  前台首页:    http://127.0.0.1:$FRONTEND_PORT/"
echo "  管理后台:    http://127.0.0.1:$FRONTEND_PORT/admin"
echo "  后端接口:    http://127.0.0.1:$BACKEND_PORT/"
echo ""

echo "[5/5] 测试账号..."
echo "  管理员:      admin / 123456"
echo "  普通用户:    user01 / 123456"
echo "  客服坐席:    agent01 / 123456"
echo ""

echo "========================================"
echo "  验收测试完成"
echo "========================================"
