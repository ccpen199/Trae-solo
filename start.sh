#!/bin/zsh
PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-63417"
BACKEND_PORT=54417
FRONTEND_PORT=44417

cd "$PROJECT_DIR"

echo "=== 清理旧进程 ==="
for PORT in $BACKEND_PORT $FRONTEND_PORT; do
  PID=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$PID" ]; then
    CWD=$(ps -o cwd= -p "$PID" 2>/dev/null | xargs)
    if [[ "$CWD" == "$PROJECT_DIR"* ]]; then
      kill -9 "$PID" 2>/dev/null
      echo "已杀掉端口 $PORT 进程 $PID"
    fi
  fi
done

sleep 2

echo "=== 启动后端服务 ==="
cd "$PROJECT_DIR/backend"
nohup node server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

sleep 5

echo "=== 启动前端服务 ==="
cd "$PROJECT_DIR/frontend"
nohup npx vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

sleep 8

echo ""
echo "=== 服务状态检查 ==="
BACKEND_LISTEN=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
FRONTEND_LISTEN=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "后端端口监听: ${BACKEND_LISTEN:-未监听}"
echo "前端端口监听: ${FRONTEND_LISTEN:-未监听}"

if [ -n "$BACKEND_LISTEN" ]; then
  HEALTH=$(curl -sS --max-time 3 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1)
  echo "后端健康检查: $HEALTH"
fi

echo ""
echo "=== 访问地址 ==="
echo "前端: http://127.0.0.1:$FRONTEND_PORT/"
echo "后端API: http://127.0.0.1:$BACKEND_PORT/api"
echo "健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "测试账号:"
echo "  admin / admin123 (管理员)"
echo "  editor1 / editor123 (编辑)"
echo "  author1 / author123 (作者)"
echo "  reader1 / reader123 (读者)"
echo "  finance1 / finance123 (结算)"
