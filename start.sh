#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           SSL证书管理系统 - 启动脚本                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $port 已被占用"
    return 1
  else
    echo "✅ 端口 $port 可用"
    return 0
  fi
}

echo "📋 检查端口占用..."
check_port 5173
check_port 5174
echo ""

if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
  echo "📦 安装依赖..."
  npm run install:all
  echo ""
fi

if [ ! -f "backend/data/ssl_manager.db" ]; then
  echo "🗄️  初始化数据库..."
  npm run init:db
  echo ""
fi

echo "🚀 启动后端服务..."
cd "$PROJECT_DIR/backend"
npm start &
BACKEND_PID=$!
echo "   后端服务 PID: $BACKEND_PID"
echo ""

sleep 3

echo "🚀 启动前端服务..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "   前端服务 PID: $FRONTEND_PID"
echo ""

cleanup() {
  echo ""
  echo "🛑 停止服务..."
  
  if kill -0 $BACKEND_PID 2>/dev/null; then
    kill $BACKEND_PID 2>/dev/null
    echo "   后端服务已停止"
  fi
  
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    kill $FRONTEND_PID 2>/dev/null
    echo "   前端服务已停止"
  fi
  
  echo "✅ 服务已全部停止"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    服务启动完成！                         ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  前端地址: http://localhost:5173                        ║"
echo "║  后端地址: http://localhost:5174                        ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  默认账号: admin / admin123                             ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  按 Ctrl+C 停止服务                                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

wait
