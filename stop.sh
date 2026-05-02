#!/bin/bash

echo "============================================"
echo "连锁门店总部管理系统 - 停止脚本"
echo "============================================"
echo ""

# 获取项目目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 停止前端服务
log_info "停止前端服务 (端口: 23000)..."
if lsof -Pi :23000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -ti :23000 | xargs kill -9 2>/dev/null || true
    log_info "前端服务已停止"
else
    log_info "前端服务未运行"
fi

# 停止后端服务
log_info "停止后端服务 (端口: 18080)..."
if lsof -Pi :18080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -ti :18080 | xargs kill -9 2>/dev/null || true
    log_info "后端服务已停止"
else
    log_info "后端服务未运行"
fi

# 清理 PID 文件
if [ -f "$PROJECT_DIR/backend.pid" ]; then
    rm -f "$PROJECT_DIR/backend.pid"
fi

if [ -f "$PROJECT_DIR/frontend.pid" ]; then
    rm -f "$PROJECT_DIR/frontend.pid"
fi

log_info "清理 PID 文件完成"

echo ""
echo "============================================"
echo "所有服务已停止"
echo "============================================"
