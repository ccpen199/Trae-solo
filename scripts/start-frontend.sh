#!/usr/bin/env bash
# ============================================================
# 前端启动脚本 - may-89093
# Vite + strictPort + 后台运行
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_FILE="$PROJECT_DIR/frontend.log"

# 加载 .env
if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

# 检查前端目录
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "ERROR: 前端目录不存在: $FRONTEND_DIR"
    echo "请先运行项目初始化"
    exit 1
fi

cd "$FRONTEND_DIR"

# 清除之前的日志
> "$LOG_FILE"

echo "=== 启动前端 (Vite) ==="
echo "  端口: $FRONTEND_PORT"
echo "  地址: http://127.0.0.1:$FRONTEND_PORT"
echo "  日志: $LOG_FILE"
echo "  模式: 后台运行 (nohup)"
echo ""

# 使用 nohup 后台启动 Vite
# --strictPort 确保端口被占用时失败退出，不会自动换端口
# --host 127.0.0.1 确保只监听本地
nohup npx vite \
    --host 127.0.0.1 \
    --port "$FRONTEND_PORT" \
    --strictPort \
    > "$LOG_FILE" 2>&1 &

FRONTEND_PID=$!
echo "  启动 PID: $FRONTEND_PID"
echo $FRONTEND_PID > "$PROJECT_DIR/.frontend.pid"

# 等待 3 秒初步检查
sleep 3

if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "ERROR: 前端进程启动失败，查看日志: $LOG_FILE"
    tail -50 "$LOG_FILE"
    exit 1
fi

echo ""
echo "=== 前端启动完成 ==="
echo "  访问: http://127.0.0.1:$FRONTEND_PORT"
echo "  日志: tail -f $LOG_FILE"
echo "  停止: ./scripts/manage.sh stop"
