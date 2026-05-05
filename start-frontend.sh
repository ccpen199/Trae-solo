#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
LOG_FILE="${SCRIPT_DIR}/frontend.log"
PID_FILE="${SCRIPT_DIR}/frontend.pid"
PORT=22216

cd "${FRONTEND_DIR}" || exit 1

if [ -f "${PID_FILE}" ]; then
    PID=$(cat "${PID_FILE}")
    if kill -0 "${PID}" 2>/dev/null; then
        echo "前端服务已在运行，PID: ${PID}"
        exit 0
    else
        echo "清理已停止的服务PID文件..."
        rm "${PID_FILE}"
    fi
fi

echo "检查端口 ${PORT} 是否被占用..."
PORT_PIDS=$(lsof -ti :${PORT} 2>/dev/null)
if [ -n "${PORT_PIDS}" ]; then
    echo "端口 ${PORT} 被以下进程占用: ${PORT_PIDS}"
    echo "正在清理占用端口的进程..."
    kill -9 ${PORT_PIDS} 2>/dev/null
    sleep 1
fi

if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖..."
    npm install
fi

echo "启动前端服务..."
echo "日志文件: ${LOG_FILE}"
echo "PID文件: ${PID_FILE}"

> "${LOG_FILE}"
nohup npm run dev > "${LOG_FILE}" 2>&1 &

PID=$!
echo ${PID} > "${PID_FILE}"

echo "等待服务启动..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 2
    if kill -0 "${PID}" 2>/dev/null; then
        if lsof -ti :${PORT} 2>/dev/null | grep -q "${PID}"; then
            echo "========================================"
            echo "前端服务启动成功!"
            echo "端口: ${PORT}"
            echo "访问地址: http://localhost:${PORT}"
            echo "PID: ${PID}"
            echo "日志: ${LOG_FILE}"
            echo "========================================"
            exit 0
        fi
    else
        break
    fi
    echo "等待中... (${i}/10)"
done

echo "前端服务启动失败"
if [ -f "${LOG_FILE}" ]; then
    echo "错误日志:"
    cat "${LOG_FILE}"
fi
rm -f "${PID_FILE}"
exit 1
