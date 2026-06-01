#!/bin/bash

cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"

check_port() {
  local port=$1
  lsof -ti tcp:$port 2>/dev/null | head -1
}

get_project_pid() {
  local port=$1
  local pid=$(check_port $port)
  if [ -n "$pid" ]; then
    local cwd=$(ps -p $pid -o cwd= 2>/dev/null | xargs 2>/dev/null)
    local cmd=$(ps -p $pid -o command= 2>/dev/null)
    if [[ "$cwd" == *"$PROJECT_DIR"* ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
      echo "$pid"
      return 0
    fi
  fi
  echo ""
  return 1
}

echo "========================================"
echo "  AI采购谈判助手 - 启动脚本"
echo "========================================"
echo ""

echo "加载环境变量..."
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "错误: .env 文件不存在"
  exit 1
fi

echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

echo "检查端口占用..."
FRONTEND_PID=$(get_project_pid $FRONTEND_PORT)
BACKEND_PID=$(get_project_pid $BACKEND_PORT)

if [ -n "$FRONTEND_PID" ]; then
  echo "前端服务已在运行 (PID: $FRONTEND_PID)，正在重启..."
  kill $FRONTEND_PID 2>/dev/null
  sleep 2
fi

if [ -n "$BACKEND_PID" ]; then
  echo "后端服务已在运行 (PID: $BACKEND_PID)，正在重启..."
  kill $BACKEND_PID 2>/dev/null
  sleep 2
fi

echo ""
echo "检查数据库..."
if [ ! -f data/app.sqlite ]; then
  echo "数据库不存在，正在初始化..."
  cd backend
  if [ ! -d node_modules ]; then
    echo "安装后端依赖..."
    npm install
  fi
  npm run init-db
  cd ..
else
  echo "数据库已存在"
fi

echo ""
echo "启动后端服务..."
cd backend
if [ ! -d node_modules ]; then
  echo "安装后端依赖..."
  npm install
fi

nohup node src/server.js > ../logs/backend.log 2>&1 &
BACKEND_START_PID=$!
echo "后端服务启动中 (PID: $BACKEND_START_PID)..."

cd ..
sleep 5

BACKEND_CHECK=$(curl -s http://127.0.0.1:$BACKEND_PORT/api/health 2>/dev/null)
if [ $? -eq 0 ] && [[ "$BACKEND_CHECK" == *"ok"* ]]; then
  echo "后端服务启动成功!"
  echo "API 地址: http://127.0.0.1:$BACKEND_PORT/api"
else
  echo "后端服务启动失败，请查看 logs/backend.log"
  cat logs/backend.log 2>/dev/null | tail -20
fi

echo ""
echo "启动前端服务..."
cd frontend
if [ ! -d node_modules ]; then
  echo "安装前端依赖..."
  npm install
fi

if [ ! -d logs ]; then
  mkdir -p ../logs
fi

nohup npx vite > ../logs/frontend.log 2>&1 &
FRONTEND_START_PID=$!
echo "前端服务启动中 (PID: $FRONTEND_START_PID)..."

cd ..
sleep 8

echo ""
echo "========================================"
echo "  服务启动完成!"
echo "========================================"
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "后端地址: http://127.0.0.1:$BACKEND_PORT"
echo "健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "后端 PID: $BACKEND_START_PID"
echo "前端 PID: $FRONTEND_START_PID"
echo ""
echo "日志文件:"
echo "  - 后端: logs/backend.log"
echo "  - 前端: logs/frontend.log"
echo ""
echo "停止服务: ./stop.sh"
echo "========================================"
