#!/bin/bash

echo "============================================"
echo "连锁门店总部管理系统 - 快速启动脚本"
echo "============================================"
echo ""

# 获取项目目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "【步骤 1/5】检查项目结构..."
cd "$PROJECT_DIR"

if [ ! -d "retail-saas-frontend" ]; then
    log_error "前端目录不存在: retail-saas-frontend"
    exit 1
fi

if [ ! -d "retail-saas-backend" ]; then
    log_error "后端目录不存在: retail-saas-backend"
    exit 1
fi

log_info "项目结构检查完成"
echo ""

echo "【步骤 2/5】检查并安装前端依赖..."
cd "$PROJECT_DIR/retail-saas-frontend"

if [ ! -d "node_modules" ]; then
    log_info "安装前端依赖 (这可能需要几分钟)..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "前端依赖安装失败"
        exit 1
    fi
    log_info "前端依赖安装完成"
else
    log_info "前端依赖已存在"
fi
echo ""

echo "【步骤 3/5】编译后端项目..."
cd "$PROJECT_DIR/retail-saas-backend"

log_info "执行 Maven 编译..."
mvn clean install -DskipTests -q

if [ $? -ne 0 ]; then
    log_error "后端编译失败，请检查错误信息"
    exit 1
fi

log_info "后端编译完成"
echo ""

echo "【步骤 4/5】启动后端服务 (端口: 18080)..."
cd "$PROJECT_DIR/retail-saas-backend/retail-saas-admin"

# 检查端口是否被占用
if lsof -Pi :18080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warn "端口 18080 已被占用，尝试杀死进程..."
    lsof -ti :18080 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 启动后端服务
log_info "启动 Spring Boot 服务 (后台运行)..."
nohup mvn spring-boot:run > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

log_info "后端服务 PID: $BACKEND_PID"
log_info "后端日志: $PROJECT_DIR/backend.log"

# 等待后端启动
log_info "等待后端服务启动 (约 30-60 秒)..."
for i in {1..60}; do
    if curl -s http://localhost:18080/api >/dev/null 2>&1; then
        log_info "后端服务已启动成功!"
        break
    fi
    if [ $((i % 10)) -eq 0 ]; then
        log_info "后端服务启动中... ($i/60)"
        # 显示最后几行日志
        tail -10 "$PROJECT_DIR/backend.log" 2>/dev/null || true
    fi
    sleep 2
done
echo ""

echo "【步骤 5/5】启动前端服务 (端口: 23000)..."
cd "$PROJECT_DIR/retail-saas-frontend"

# 检查端口是否被占用
if lsof -Pi :23000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warn "端口 23000 已被占用，尝试杀死进程..."
    lsof -ti :23000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 启动前端服务
log_info "启动前端开发服务器 (后台运行)..."
nohup npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

log_info "前端服务 PID: $FRONTEND_PID"
log_info "前端日志: $PROJECT_DIR/frontend.log"

# 等待前端启动
log_info "等待前端服务启动 (约 10-20 秒)..."
for i in {1..30}; do
    if curl -s http://localhost:23000 >/dev/null 2>&1; then
        log_info "前端服务已启动成功!"
        break
    fi
    if [ $((i % 5)) -eq 0 ]; then
        log_info "前端服务启动中... ($i/30)"
        tail -10 "$PROJECT_DIR/frontend.log" 2>/dev/null || true
    fi
    sleep 1
done
echo ""

# 保存 PID
echo "$BACKEND_PID" > "$PROJECT_DIR/backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_DIR/frontend.pid"

echo "============================================"
echo "🎉 系统启动完成！"
echo "============================================"
echo ""
echo "【服务地址】"
echo "  前端页面:    http://localhost:23000"
echo "  后端API:     http://localhost:18080/api"
echo "  API文档:     http://localhost:18080/api/doc.html"
echo ""
echo "【测试账号】(密码: 123456)"
echo "  超级管理员:  admin"
echo "  总部运营:    hq_operator"
echo "  区域经理:    region_manager"
echo "  门店店长:    store_manager"
echo "  财务人员:    finance"
echo ""
echo "【日志文件】"
echo "  后端日志:    $PROJECT_DIR/backend.log"
echo "  前端日志:    $PROJECT_DIR/frontend.log"
echo ""
echo "【停止服务】"
echo "  执行: cd $PROJECT_DIR && ./stop.sh"
echo ""
echo "============================================"
echo "请在浏览器中打开: http://localhost:23000"
