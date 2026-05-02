#!/bin/bash

echo "========================================="
echo "冷链物流温控平台 - 快速启动脚本"
echo "========================================="

# 检查端口可用性
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo "警告: 端口 $port 已被占用"
        return 1
    else
        echo "端口 $port 可用"
        return 0
    fi
}

echo ""
echo "检查关键端口..."
check_port 8080
check_port 8081

echo ""
echo "启动前端开发服务器..."
cd frontend
npm install --legacy-peer-deps
npm run dev &
FRONTEND_PID=$!
echo "前端服务器已启动 (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "========================================="
echo "启动完成!"
echo "========================================="
echo ""
echo "访问地址:"
echo "  前端: http://localhost:8081"
echo ""
echo "注意: 后端服务需要单独启动，或使用Docker Compose"
echo ""
echo "停止服务时请按 Ctrl+C"
echo ""

# 等待用户中断
wait $FRONTEND_PID
