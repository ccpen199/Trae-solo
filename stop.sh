#!/bin/bash

echo "======================================"
echo "停止知识社区服务"
echo "======================================"

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "$ROOT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$ROOT_DIR/logs/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "已停止后端服务 (PID: $BACKEND_PID)"
    else
        echo "后端服务未运行"
    fi
    rm -f "$ROOT_DIR/logs/backend.pid"
fi

if [ -f "$ROOT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$ROOT_DIR/logs/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "已停止前端服务 (PID: $FRONTEND_PID)"
    else
        echo "前端服务未运行"
    fi
    rm -f "$ROOT_DIR/logs/frontend.pid"
fi

echo ""
echo "服务已全部停止"
echo "======================================"
