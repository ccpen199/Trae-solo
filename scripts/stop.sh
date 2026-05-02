#!/bin/bash

echo "========================================"
echo "  保险投保理赔系统 - 停止服务"
echo "========================================"

PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
LOG_DIR="$PROJECT_DIR/logs"

echo ""
echo "正在停止服务..."

if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "后端服务已停止 (PID: $BACKEND_PID)"
    else
        echo "后端服务已停止 (PID: $BACKEND_PID 不存在)"
    fi
    rm -f "$LOG_DIR/backend.pid"
else
    echo "未找到后端服务PID文件"
fi

if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "前端服务已停止 (PID: $FRONTEND_PID)"
    else
        echo "前端服务已停止 (PID: $FRONTEND_PID 不存在)"
    fi
    rm -f "$LOG_DIR/frontend.pid"
else
    echo "未找到前端服务PID文件"
fi

pkill -f "node.*backend/src/app.js" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

echo ""
echo "========================================"
echo "  服务已停止！"
echo "========================================"
echo ""
