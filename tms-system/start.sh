#!/bin/bash

echo "========================================="
echo "  TMS 运输调度系统 - 启动脚本"
echo "========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js 已安装: $(node -v)"

# 安装后端依赖
echo ""
echo -e "${YELLOW}安装后端依赖...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -d "node_modules" ]; then
    npm install
fi

# 安装前端依赖
echo ""
echo -e "${YELLOW}安装前端依赖...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "========================================="
echo "  启动服务"
echo "========================================="

# 启动后端服务
echo ""
echo -e "${YELLOW}启动后端服务 (端口 7010)...${NC}"
cd "$PROJECT_ROOT/backend"
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✓${NC} 后端服务已启动 (PID: $BACKEND_PID)"

# 等待服务启动
sleep 2

# 启动前端开发服务器
echo ""
echo -e "${YELLOW}启动前端开发服务器 (端口 7011)...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓${NC} 前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "========================================="
echo "  服务状态"
echo "========================================="
echo -e "${GREEN}后端 API:${NC}  http://localhost:7010"
echo -e "${GREEN}前端页面:${NC}  http://localhost:7011"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 保存PID
echo "$BACKEND_PID" > /tmp/tms-backend.pid
echo "$FRONTEND_PID" > /tmp/tms-frontend.pid

# 等待用户中断
wait
