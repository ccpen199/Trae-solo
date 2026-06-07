#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env 2>/dev/null
FRONTEND_PORT=${FRONTEND_PORT:-49022}
BACKEND_PORT=${BACKEND_PORT:-59022}

echo "========================================"
echo "  丰巢快递员SaaS平台启动脚本"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo "========================================"

cleanup_port() {
  local PORT=$1
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
    if echo "$cmd" | grep -q "may-89022"; then
      kill "$pid" 2>/dev/null
      echo "已终止端口 $PORT 的进程 (PID: $pid)"
    else
      echo "端口 $PORT 被其他项目占用 (PID: $pid)，跳过"
    fi
  fi
}

echo ""
echo "正在清理旧进程..."
cleanup_port $FRONTEND_PORT
cleanup_port $BACKEND_PORT
sleep 2

echo ""
echo "正在启动后端服务 (端口 $BACKEND_PORT)..."
cd "$PROJECT_DIR/backend"
node server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动，PID: $BACKEND_PID"

sleep 5

if ! lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN > /dev/null 2>&1; then
  echo "错误: 后端服务启动失败，请查看 backend.log"
  cat "$PROJECT_DIR/backend.log" | tail -20
  exit 1
fi

backend_pid_check=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
backend_stat=$(ps -o stat= -p "$backend_pid_check" 2>/dev/null)
echo "后端进程状态: $backend_stat"

if echo "$backend_stat" | grep -qE 'T|Z'; then
  echo "错误: 后端进程处于异常状态 ($backend_stat)"
  exit 1
fi

echo "后端健康检查: $(curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1)"

echo ""
echo "正在启动前端服务 (端口 $FRONTEND_PORT)..."
cd "$PROJECT_DIR/frontend"
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port $FRONTEND_PORT --strictPort < /dev/null > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动，PID: $FRONTEND_PID"

sleep 8

if ! lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN > /dev/null 2>&1; then
  echo "错误: 前端服务启动失败，请查看 frontend.log"
  cat "$PROJECT_DIR/frontend.log" | tail -20
  exit 1
fi

frontend_pid_check=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
frontend_stat=$(ps -o stat= -p "$frontend_pid_check" 2>/dev/null)
echo "前端进程状态: $frontend_stat"

if echo "$frontend_stat" | grep -qE 'T|Z'; then
  echo "错误: 前端进程处于异常状态 ($frontend_stat)"
  exit 1
fi

echo ""
echo "========================================"
echo "  服务启动完成"
echo "========================================"
echo "后端地址: http://127.0.0.1:$BACKEND_PORT"
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "后端日志: $PROJECT_DIR/backend.log"
echo "前端日志: $PROJECT_DIR/frontend.log"
echo ""
echo "默认账号: courier001 / 123456"
echo "========================================"

echo ""
echo "=== 最终验证 ==="

echo -n "前端首页 HTTP: "
FRONT_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:$FRONTEND_PORT/ 2>&1)
echo "$FRONT_HTTP"

echo -n "后端健康检查 HTTP: "
BACK_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1)
echo "$BACK_HTTP"

echo -n "前端 favicon: "
FAV_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/favicon.ico 2>&1)
echo "$FAV_HTTP"

if [ "$FRONT_HTTP" = "200" ] && [ "$BACK_HTTP" = "200" ]; then
  echo ""
  echo "✓ 前后端服务均正常启动并通过验证"
else
  echo ""
  echo "⚠ 部分验证未通过，请检查日志"
fi
