#!/bin/bash

# 电子签约系统 - 启动脚本
# 端口配置 (项目序号9171作为后缀):
#   后端: 19171 (前缀1 + 9171)
#   前端: 29171 (前缀2 + 9171)
# 注意: 端口必须 < 65535

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOGS_DIR="$SCRIPT_DIR/logs"

# 端口配置
BACKEND_PORT=19171
FRONTEND_PORT=29171

# 创建日志目录
mkdir -p "$LOGS_DIR"

# 停止旧进程
echo "========================================"
echo "   停止旧进程..."
echo "========================================"

# 停止后端端口
BACKEND_PID=$(lsof -ti:$BACKEND_PORT 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
    echo "停止后端进程 (端口: $BACKEND_PORT, PID: $BACKEND_PID)..."
    kill -9 $BACKEND_PID 2>/dev/null || true
else
    echo "后端端口 $BACKEND_PORT 无运行进程"
fi

# 停止前端端口
FRONTEND_PID=$(lsof -ti:$FRONTEND_PORT 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
    echo "停止前端进程 (端口: $FRONTEND_PORT, PID: $FRONTEND_PID)..."
    kill -9 $FRONTEND_PID 2>/dev/null || true
else
    echo "前端端口 $FRONTEND_PORT 无运行进程"
fi

# 停止旧端口 (9171, 9172, 91710, 91711)
OLD_PORTS="9171 9172 91710 91711"
for port in $OLD_PORTS; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "停止旧端口 $port 进程 (PID: $PID)..."
        kill -9 $PID 2>/dev/null || true
    fi
done

# 等待进程完全停止
sleep 2

echo ""
echo "========================================"
echo "   启动后端服务..."
echo "========================================"

cd "$BACKEND_DIR"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install
fi

# 使用 nohup 启动后端
BACKEND_LOG="$LOGS_DIR/backend.log"
echo "日志文件: $BACKEND_LOG"
echo "启动后端服务 (端口: $BACKEND_PORT)..."

nohup npm start > "$BACKEND_LOG" 2>&1 &
BACKEND_START_PID=$!
echo "后端进程 PID: $BACKEND_START_PID"

# 等待后端启动
echo "等待后端启动完成..."
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        echo ""
        echo "后端服务已启动 ✓"
        break
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "========================================"
echo "   启动前端服务..."
echo "========================================"

cd "$FRONTEND_DIR"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 使用 nohup 启动前端
FRONTEND_LOG="$LOGS_DIR/frontend.log"
echo "日志文件: $FRONTEND_LOG"
echo "启动前端服务 (端口: $FRONTEND_PORT)..."

nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_START_PID=$!
echo "前端进程 PID: $FRONTEND_START_PID"

# 等待前端启动
echo "等待前端启动完成..."
for i in {1..50}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo ""
        echo "前端服务已启动 ✓"
        break
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "========================================"
echo "   服务启动完成"
echo "========================================"
echo ""
echo "访问地址:"
echo "   前端页面: http://localhost:$FRONTEND_PORT"
echo "   后端API:  http://localhost:$BACKEND_PORT"
echo "   健康检查: http://localhost:$BACKEND_PORT/health"
echo ""
echo "测试账号:"
echo "   法务管理员: admin / admin123"
echo "   发起方用户: initiator / admin123"
echo "   签署方用户: signer / admin123"
echo ""
echo "日志文件:"
echo "   后端日志: $BACKEND_LOG"
echo "   前端日志: $FRONTEND_LOG"
echo ""
echo "进程信息:"
echo "   后端 PID: $BACKEND_START_PID"
echo "   前端 PID: $FRONTEND_START_PID"
echo ""
echo "停止服务命令:"
echo "   $SCRIPT_DIR/stop.sh"
echo ""
echo "========================================"
