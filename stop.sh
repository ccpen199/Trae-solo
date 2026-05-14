#!/bin/bash

# 餐饮App停止脚本
# 使用方法：./stop.sh

echo "=========================================="
echo "停止餐饮App服务"
echo "=========================================="

# 停止后端
if pgrep -f "node.*server.js" > /dev/null; then
    echo "停止后端服务..."
    pkill -9 -f "node.*server.js"
    sleep 1
fi

# 停止前端
if pgrep -f "vite" > /dev/null; then
    echo "停止前端服务..."
    pkill -9 -f "vite"
    sleep 1
fi

# 清理PID文件
rm -f /Users/chen/Documents/trae_projects/local_projects/may-988/backend/backend.pid
rm -f /Users/chen/Documents/trae_projects/local_projects/may-988/frontend/frontend.pid

echo ""
echo "=========================================="
echo "✅ 服务已停止"
echo "=========================================="
