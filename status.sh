#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID="${SCRIPT_DIR}/backend.pid"
FRONTEND_PID="${SCRIPT_DIR}/frontend.pid"

echo "========================================"
echo "简易搜索引擎服务状态"
echo "========================================"
echo ""

if [ -f "${BACKEND_PID}" ]; then
    PID=$(cat "${BACKEND_PID}")
    if kill -0 "${PID}" 2>/dev/null; then
        echo "后端服务: 运行中 (PID: ${PID})"
        echo "端口: 12216"
        echo "地址: http://localhost:12216"
    else
        echo "后端服务: 未运行 (PID文件存在但进程不存在)"
    fi
else
    echo "后端服务: 未运行"
fi

echo ""

if [ -f "${FRONTEND_PID}" ]; then
    PID=$(cat "${FRONTEND_PID}")
    if kill -0 "${PID}" 2>/dev/null; then
        echo "前端服务: 运行中 (PID: ${PID})"
        echo "端口: 22216"
        echo "地址: http://localhost:22216"
    else
        echo "前端服务: 未运行 (PID文件存在但进程不存在)"
    fi
else
    echo "前端服务: 未运行"
fi

echo ""
echo "========================================"
