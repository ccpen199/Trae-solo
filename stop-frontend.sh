#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${SCRIPT_DIR}/frontend.pid"

if [ -f "${PID_FILE}" ]; then
    PID=$(cat "${PID_FILE}")
    if kill -0 "${PID}" 2>/dev/null; then
        echo "停止前端服务 (PID: ${PID})..."
        kill "${PID}"
        rm "${PID_FILE}"
        echo "前端服务已停止"
    else
        echo "前端服务未运行"
        rm "${PID_FILE}"
    fi
else
    echo "未找到前端服务PID文件"
fi
