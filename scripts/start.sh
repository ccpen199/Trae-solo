#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

PORT_MANAGER="$PROJECT_DIR/scripts/port-manager.sh"
chmod +x "$PORT_MANAGER"

echo "=== 项目启动准备 ==="
echo "项目目录: $PROJECT_DIR"
echo ""

echo "1. 检查并分配可用端口..."
bash "$PORT_MANAGER" find
echo ""

echo "2. 加载环境配置..."
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        [[ -z "$key" || "$key" =~ ^# ]] && continue
        export "$key=$value"
    done < .env
fi
echo "   前端端口: $FRONTEND_PORT"
echo "   后端端口: $BACKEND_PORT"
echo ""

echo "3. 检查是否已有本项目进程运行..."
bash "$PORT_MANAGER" check || true
echo ""

echo "4. 终止本项目旧进程（如果存在）..."
bash "$PORT_MANAGER" kill-all || true
sleep 2
echo ""

echo "5. 确保数据目录存在..."
mkdir -p "$PROJECT_DIR/data"
mkdir -p "$PROJECT_DIR/logs"
echo ""

echo "6. 编译后端 TypeScript..."
if [ -d "$PROJECT_DIR/backend" ] && [ -f "$PROJECT_DIR/backend/package.json" ]; then
    cd "$PROJECT_DIR/backend"
    if [ -d "src" ]; then
        echo "   正在编译 TypeScript..."
        npm run build >> "$PROJECT_DIR/logs/backend-build.log" 2>&1
        echo "   编译完成"
    fi
fi
cd "$PROJECT_DIR"
echo ""

echo "7. 启动后端服务 (后台运行)..."
if [ -d "$PROJECT_DIR/backend" ] && [ -f "$PROJECT_DIR/backend/package.json" ]; then
    cd "$PROJECT_DIR/backend"
    if [ -f "dist/server.js" ]; then
        BACKEND_PID=$(node "$PROJECT_DIR/scripts/spawn-detached.js" "$PROJECT_DIR/backend" "$PROJECT_DIR/logs/backend.log" "$PROJECT_DIR/backend.pid" node dist/server.js)
    else
        BACKEND_PID=$(node "$PROJECT_DIR/scripts/spawn-detached.js" "$PROJECT_DIR/backend" "$PROJECT_DIR/logs/backend.log" "$PROJECT_DIR/backend.pid" npm run start:dev)
    fi
    echo "   后端启动中，PID=$BACKEND_PID"
    echo "   日志: $PROJECT_DIR/logs/backend.log"
else
    echo "   警告: 后端项目未初始化，跳过后端启动"
    BACKEND_PID=""
fi
cd "$PROJECT_DIR"
echo ""

echo "8. 启动前端服务 (后台运行)..."
if [ -d "$PROJECT_DIR/frontend" ] && [ -f "$PROJECT_DIR/frontend/package.json" ]; then
    cd "$PROJECT_DIR/frontend"
    FRONTEND_PID=$(node "$PROJECT_DIR/scripts/spawn-detached.js" "$PROJECT_DIR/frontend" "$PROJECT_DIR/logs/frontend.log" "$PROJECT_DIR/frontend.pid" node node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort)
    echo "   前端启动中，PID=$FRONTEND_PID"
    echo "   日志: $PROJECT_DIR/logs/frontend.log"
else
    echo "   警告: 前端项目未初始化，跳过前端启动"
    FRONTEND_PID=""
fi
cd "$PROJECT_DIR"
echo ""

echo "9. 等待服务启动 (15秒)..."
sleep 15
echo ""

echo "9. 服务验收检查..."
bash "$PROJECT_DIR/scripts/verify.sh"
echo ""

echo "=== 启动完成 ==="
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "后端地址: http://127.0.0.1:$BACKEND_PORT"
echo "前端日志: tail -f $PROJECT_DIR/logs/frontend.log"
echo "后端日志: tail -f $PROJECT_DIR/logs/backend.log"
echo ""
echo "停止服务: bash scripts/stop.sh"
echo "重启服务: bash scripts/restart.sh"
