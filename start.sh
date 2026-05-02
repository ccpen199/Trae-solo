#!/bin/bash
# ============================================================
# 连锁门店总部管理系统 - 启动脚本
# 端口策略：
# - 后端服务: 18080 (避免8080常用端口)
# - 前端服务: 23000 (避免3000常用端口)
# - 中间件: MySQL(3306), Redis(6379), RabbitMQ(5672/15672), MinIO(9000/9001)
# ============================================================

set -e

echo "============================================"
echo "连锁门店总部管理系统 - 启动中..."
echo "============================================"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "命令 $1 不存在，请先安装"
        exit 1
    fi
}

# 检查端口是否被占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "端口 $port ($service) 已被占用"
        return 1
    fi
    return 0
}

# 检查环境
log_info "检查运行环境..."
check_command docker
check_command docker-compose
check_command mvn
check_command npm

log_info "环境检查完成"
echo ""

# ============================================================
# 启动中间件服务
# ============================================================
log_info "启动中间件服务 (MySQL/Redis/RabbitMQ/MinIO)..."
echo ""

cd "$PROJECT_DIR"

# 检查端口
check_port 3306 "MySQL" || log_warn "MySQL端口可能被占用"
check_port 6379 "Redis" || log_warn "Redis端口可能被占用"
check_port 5672 "RabbitMQ" || log_warn "RabbitMQ端口可能被占用"
check_port 15672 "RabbitMQ管理面板" || log_warn "RabbitMQ管理面板端口可能被占用"
check_port 9000 "MinIO API" || log_warn "MinIO API端口可能被占用"
check_port 9001 "MinIO控制台" || log_warn "MinIO控制台端口可能被占用"

# 启动Docker服务
log_info "使用 Docker Compose 启动中间件..."
docker-compose up -d

log_info "等待中间件服务就绪 (约30秒)..."
sleep 10

# 检查MySQL是否就绪
log_info "检查 MySQL 连接..."
for i in {1..30}; do
    if docker exec retail-mysql mysql -uroot -pretail@2024 -e "SELECT 1" >/dev/null 2>&1; then
        log_info "MySQL 已就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        log_warn "MySQL 启动较慢，继续等待可能需要更长时间"
    else
        sleep 2
    fi
done

# 检查Redis是否就绪
log_info "检查 Redis 连接..."
for i in {1..10}; do
    if docker exec retail-redis redis-cli -a retail@2024 ping >/dev/null 2>&1; then
        log_info "Redis 已就绪"
        break
    fi
    if [ $i -eq 10 ]; then
        log_warn "Redis 启动较慢"
    else
        sleep 1
    fi
done

echo ""
log_info "中间件服务启动完成"
echo ""

# ============================================================
# 编译后端项目
# ============================================================
log_info "编译后端项目..."
echo ""

cd "$PROJECT_DIR/retail-saas-backend"

log_info "执行 Maven 编译..."
mvn clean install -DskipTests -q

if [ $? -ne 0 ]; then
    log_error "后端项目编译失败"
    exit 1
fi

log_info "后端项目编译完成"
echo ""

# ============================================================
# 启动后端服务
# ============================================================
log_info "启动后端服务 (端口: 18080)..."
echo ""

cd "$PROJECT_DIR/retail-saas-backend/retail-saas-admin"

# 检查后端端口
check_port 18080 "后端服务" && {
    log_info "启动 Spring Boot 服务..."
    
    # 启动后端服务（后台运行）
    nohup mvn spring-boot:run > "$PROJECT_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    log_info "后端服务正在启动，PID: $BACKEND_PID"
    log_info "日志文件: $PROJECT_DIR/backend.log"
    
    # 等待后端启动
    log_info "等待后端服务就绪..."
    for i in {1..60}; do
        if curl -s http://localhost:18080/api/actuator/health >/dev/null 2>&1 || \
           curl -s http://localhost:18080/api/doc.html >/dev/null 2>&1; then
            log_info "后端服务已就绪"
            break
        fi
        if [ $((i % 10)) -eq 0 ]; then
            log_info "后端服务启动中... ($i/60)"
        fi
        sleep 2
    done
}

echo ""

# ============================================================
# 安装前端依赖并启动
# ============================================================
log_info "启动前端服务 (端口: 23000)..."
echo ""

cd "$PROJECT_DIR/retail-saas-frontend"

# 检查前端端口
check_port 23000 "前端服务" && {
    # 检查node_modules是否存在
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    log_info "启动前端开发服务器..."
    
    # 启动前端服务（后台运行）
    nohup npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    log_info "前端服务正在启动，PID: $FRONTEND_PID"
    log_info "日志文件: $PROJECT_DIR/frontend.log"
    
    # 等待前端启动
    log_info "等待前端服务就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:23000 >/dev/null 2>&1; then
            log_info "前端服务已就绪"
            break
        fi
        if [ $((i % 5)) -eq 0 ]; then
            log_info "前端服务启动中... ($i/30)"
        fi
        sleep 1
    done
}

echo ""

# ============================================================
# 显示访问信息
# ============================================================
echo "============================================"
echo "系统启动完成！"
echo "============================================"
echo ""
echo "【服务端口】"
echo "  前端页面:    http://localhost:23000"
echo "  后端API:     http://localhost:18080/api"
echo "  API文档:     http://localhost:18080/api/doc.html"
echo ""
echo "【中间件管理面板】"
echo "  RabbitMQ:    http://localhost:15672 (用户: retail / 密码: retail@2024)"
echo "  MinIO:       http://localhost:9001 (用户: minioadmin / 密码: minioadmin@2024)"
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
echo "  执行 ./stop.sh 停止所有服务"
echo ""
echo "============================================"

# 保存PID到文件
echo "$BACKEND_PID" > "$PROJECT_DIR/backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_DIR/frontend.pid"

log_info "系统启动完成！请访问 http://localhost:23000"
