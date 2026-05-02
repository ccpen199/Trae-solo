#!/bin/bash

# 电子签约系统 - 停止脚本
# 端口配置: 后端19171, 前端29171

echo "========================================"
echo "   停止电子签约系统服务"
echo "========================================"
echo ""

# 端口列表
PORTS="19171 29171 9171 9172 91710 91711"

for port in $PORTS; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "停止端口 $port 进程 (PID: $PID)..."
        kill -9 $PID 2>/dev/null || true
    else
        echo "端口 $port 无运行进程"
    fi
done

echo ""
echo "========================================"
echo "   服务已停止"
echo "========================================"
echo ""
echo "如需重新启动，请运行:"
echo "   ./start.sh"
echo ""
