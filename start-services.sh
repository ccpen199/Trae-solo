#!/bin/bash

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/xm-11173"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

echo "========================================"
echo "代码托管平台协作系统 - 启动服务"
echo "========================================"
echo ""

# 停止已有服务
echo "1. 停止已有服务..."
pkill -f "node.*src/server.js" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true
sleep 1

# 启动后端服务
echo "2. 启动后端服务 (端口: 11731)..."
cd "$BACKEND_DIR"
nohup node src/server.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   后端服务 PID: $BACKEND_PID"
echo "   日志文件: $LOG_DIR/backend.log"

# 等待后端启动
sleep 3

# 检查后端是否正常
echo "3. 检查后端服务状态..."
for i in 1 2 3 4 5; do
    if curl -s "http://localhost:11731/health" > /dev/null 2>&1; then
        echo "   ✓ 后端服务已启动"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "   ✗ 后端服务启动失败，请检查日志"
        cat "$LOG_DIR/backend.log"
        exit 1
    fi
    sleep 2
done

# 启动前端服务
echo "4. 启动前端服务 (端口: 11732)..."
cd "$FRONTEND_DIR"
nohup npx vite --port 11732 --host 0.0.0.0 > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   前端服务 PID: $FRONTEND_PID"
echo "   日志文件: $LOG_DIR/frontend.log"

# 等待前端启动
sleep 5

# 检查前端是否正常
echo "5. 检查前端服务状态..."
for i in 1 2 3 4 5; do
    if curl -s "http://localhost:11732/" > /dev/null 2>&1; then
        echo "   ✓ 前端服务已启动"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "   ⚠ 前端服务可能还在启动中，请稍后访问"
    fi
    sleep 2
done

# 保存 PID
echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"

echo ""
echo "========================================"
echo "服务启动完成！"
echo "========================================"
echo ""
echo "访问地址:"
echo "  - 前端: http://localhost:11732"
echo "  - 后端: http://localhost:11731"
echo ""
echo "默认账号:"
echo "  - admin / admin123    (管理员)"
echo "  - developer / admin123 (开发者)"
echo "  - reviewer / admin123  (审查者)"
echo "  - devops / admin123    (运维)"
echo ""
echo "服务 PID:"
echo "  - 后端: $BACKEND_PID"
echo "  - 前端: $FRONTEND_PID"
echo ""
echo "停止服务命令:"
echo "  - kill $BACKEND_PID (停止后端)"
echo "  - kill $FRONTEND_PID (停止前端)"
echo ""
