#!/usr/bin/env bash
# ============================================================
# 后端启动脚本 - may-89093
# Node.js / Python 后端，显式端口，后台运行
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
BACKEND_DIR="$PROJECT_DIR/backend"
LOG_FILE="$PROJECT_DIR/backend.log"

# 加载 .env
if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

# 检查后端目录
if [ ! -d "$BACKEND_DIR" ]; then
    echo "ERROR: 后端目录不存在: $BACKEND_DIR"
    echo "请先运行项目初始化"
    exit 1
fi

cd "$BACKEND_DIR"

# 清除之前的日志
> "$LOG_FILE"

echo "=== 启动后端 API ==="
echo "  端口: $BACKEND_PORT"
echo "  地址: http://127.0.0.1:$BACKEND_PORT"
echo "  日志: $LOG_FILE"
echo "  模式: 后台运行 (nohup)"
echo ""

# 检测后端类型并启动
if [ -f "$BACKEND_DIR/package.json" ]; then
    # Node.js 后端
    echo "  检测到 Node.js 后端"

    # 检查 package.json 中的启动脚本
    if grep -q '"start"' "$BACKEND_DIR/package.json"; then
        nohup npm start > "$LOG_FILE" 2>&1 &
    elif grep -q '"dev"' "$BACKEND_DIR/package.json"; then
        nohup npm run dev > "$LOG_FILE" 2>&1 &
    else
        # 默认直接启动 index.js / server.js / app.js
        if [ -f "$BACKEND_DIR/index.js" ]; then
            nohup node index.js > "$LOG_FILE" 2>&1 &
        elif [ -f "$BACKEND_DIR/server.js" ]; then
            nohup node server.js > "$LOG_FILE" 2>&1 &
        elif [ -f "$BACKEND_DIR/app.js" ]; then
            nohup node app.js > "$LOG_FILE" 2>&1 &
        else
            echo "ERROR: 无法确定 Node.js 后端启动方式"
            exit 1
        fi
    fi
elif [ -f "$BACKEND_DIR/main.py" ] || [ -f "$BACKEND_DIR/app.py" ] || [ -f "$BACKEND_DIR/server.py" ]; then
    # Python 后端
    echo "  检测到 Python 后端"

    if [ -f "$BACKEND_DIR/main.py" ]; then
        nohup python3 main.py > "$LOG_FILE" 2>&1 &
    elif [ -f "$BACKEND_DIR/app.py" ]; then
        nohup python3 app.py > "$LOG_FILE" 2>&1 &
    else
        nohup python3 server.py > "$LOG_FILE" 2>&1 &
    fi
else
    echo "ERROR: 无法识别后端类型，请确保后端项目已初始化"
    exit 1
fi

BACKEND_PID=$!
echo "  启动 PID: $BACKEND_PID"
echo $BACKEND_PID > "$PROJECT_DIR/.backend.pid"

# 等待 3 秒初步检查
sleep 3

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "ERROR: 后端进程启动失败，查看日志: $LOG_FILE"
    tail -50 "$LOG_FILE"
    exit 1
fi

echo ""
echo "=== 后端启动完成 ==="
echo "  访问: http://127.0.0.1:$BACKEND_PORT"
echo "  健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
echo "  日志: tail -f $LOG_FILE"
echo "  停止: ./scripts/manage.sh stop"
