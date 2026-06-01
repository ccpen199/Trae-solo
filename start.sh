#!/bin/bash

echo "========================================"
echo "  企业培训直播系统 - 启动脚本"
echo "========================================"

PROJECT_DIR=$(pwd)

echo "检查端口占用..."

check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "端口 $1 已被占用，正在检查归属..."
    PID=$(lsof -Pi :$1 -sTCP:LISTEN -t | head -1)
    CMD=$(ps -p $PID -o command= 2>/dev/null || echo "unknown")
    CWD=$(lsof -p $PID -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -1)
    
    if [[ "$CWD" == *"may-63419"* ]] || [[ "$CMD" == *"may-63419"* ]]; then
      echo "属于当前项目，正在终止 PID: $PID"
      kill $PID
      sleep 2
    else
      echo "警告：端口 $1 被其他进程占用 (PID: $PID)"
      echo "请手动释放端口或修改 .env 配置"
    fi
  fi
}

check_port 3000
check_port 5173

echo ""
echo "检查依赖..."

if [ ! -d "backend/node_modules" ]; then
  echo "安装后端依赖..."
  cd backend && npm install
  cd $PROJECT_DIR
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "安装前端依赖..."
  cd frontend && npm install
  cd $PROJECT_DIR
fi

echo ""
echo "初始化数据库..."
if [ ! -f "backend/database/training.db" ]; then
  cd backend && npm run init-db
  cd $PROJECT_DIR
fi

echo ""
echo "启动服务..."
echo "后端端口: 3000"
echo "前端端口: 5173"
echo ""

npm run dev
