#!/bin/bash

echo "========================================"
echo "  保险投保理赔系统 - 启动服务"
echo "========================================"

PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

echo ""
echo "项目目录: $PROJECT_DIR"
echo "日志目录: $LOG_DIR"

echo ""
echo "正在启动后端服务 (端口: 11084)..."
cd "$BACKEND_DIR"
nohup npm run start > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend.pid"
echo "后端服务已启动，PID: $BACKEND_PID"
echo "日志文件: $LOG_DIR/backend.log"

echo ""
echo "等待后端服务就绪..."
sleep 3

echo ""
echo "正在启动前端服务 (端口: 11085)..."
cd "$FRONTEND_DIR"
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
echo "前端服务已启动，PID: $FRONTEND_PID"
echo "日志文件: $LOG_DIR/frontend.log"

echo ""
echo "等待前端服务就绪..."
sleep 5

echo ""
echo "========================================"
echo "  服务启动完成！"
echo "========================================"
echo ""
echo "访问地址："
echo "  前端页面: http://localhost:11085"
echo "  后端接口: http://localhost:11084"
echo ""
echo "测试账号："
echo "  管理员: admin / admin123"
echo "  代理人: agent1 / agent123"
echo "  核保员: underwriter1 / under123"
echo "  理赔员: claim1 / claim123"
echo "  投保人: user1 / user123"
echo ""
echo "查看日志命令："
echo "  后端日志: tail -f $LOG_DIR/backend.log"
echo "  前端日志: tail -f $LOG_DIR/frontend.log"
echo ""
echo "停止服务命令："
echo "  ./scripts/stop.sh"
echo ""
