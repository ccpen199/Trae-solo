#!/bin/bash

echo "======================================"
echo "知识社区项目启动"
echo "======================================"

# 获取项目根目录
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$ROOT_DIR"

# 创建日志目录
mkdir -p logs

echo ""
echo "检查并安装后端依赖..."
cd "$ROOT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "初始化数据库..."
node src/scripts/init-db.js

echo ""
echo "启动后端服务 (端口 47581)..."
nohup node src/server.js > "$ROOT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT_DIR/logs/backend.pid"

echo ""
echo "检查并安装前端依赖..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "启动前端服务 (端口 47582)..."
nohup npx vite > "$ROOT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$ROOT_DIR/logs/frontend.pid"

echo ""
echo "等待服务启动..."
sleep 5

echo ""
echo "======================================"
echo "启动完成！"
echo "======================================"
echo "后端地址: http://localhost:47581"
echo "前端地址: http://localhost:47582"
echo ""
echo "后端进程ID: $BACKEND_PID"
echo "前端进程ID: $FRONTEND_PID"
echo ""
echo "演示账号: demo / 123456"
echo ""
echo "日志文件位置:"
echo "  后端: logs/backend.log"
echo "  前端: logs/frontend.log"
echo ""
echo "停止服务请运行: ./stop.sh"
echo "======================================"
