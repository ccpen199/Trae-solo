#!/bin/bash

set -e

echo "========================================="
echo "  外卖聚合接单系统 - 启动脚本"
echo "  端口配置:"
echo "  - 后端服务: ${SERVER_PORT:-8362}"
echo "  - 前端服务: ${FRONTEND_PORT:-9471}"
echo "  - MySQL: ${MYSQL_PORT:-3306}"
echo "  - Redis: ${REDIS_PORT:-6379}"
echo "  - RabbitMQ: ${RABBITMQ_PORT:-5672}"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

check_port() {
    local port=$1
    local service=$2
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i :$port >/dev/null 2>&1; then
            echo "警告: 端口 $port 已被占用，服务 $service 可能无法启动"
            return 1
        fi
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo "警告: 端口 $port 已被占用，服务 $service 可能无法启动"
            return 1
        fi
    fi
    echo "✓ 端口 $port 可用 ($service)"
    return 0
}

echo ""
echo "检查端口可用性..."
check_port "${SERVER_PORT:-8362}" "后端服务" || true
check_port "${FRONTEND_PORT:-9471}" "前端服务" || true

echo ""
echo "启动服务..."

if [ -f ".env" ]; then
    echo "加载环境变量配置..."
    export $(grep -v '^#' .env | xargs)
fi

if command -v docker-compose >/dev/null 2>&1; then
    echo "使用 Docker Compose 启动..."
    docker-compose up -d
    
    echo ""
    echo "等待服务启动..."
    sleep 10
    
    echo ""
    echo "检查容器状态..."
    docker-compose ps
    
    echo ""
    echo "========================================="
    echo "  服务启动完成!"
    echo ""
    echo "  访问地址:"
    echo "  - 前端: http://localhost:${FRONTEND_PORT:-9471}"
    echo "  - 后端API: http://localhost:${SERVER_PORT:-8362}"
    echo "  - API文档: http://localhost:${SERVER_PORT:-8362}/swagger-ui.html"
    echo ""
    echo "  默认账号:"
    echo "  - 系统管理员: admin / 123456"
    echo "  - 商家: merchant / 123456"
    echo "  - 店员: clerk / 123456"
    echo "  - 骑手: rider / 123456"
    echo ""
    echo "  停止服务: docker-compose down"
    echo "  查看日志: docker-compose logs -f"
    echo "========================================="
    
elif command -v docker >/dev/null 2>&1; then
    echo "Docker 已安装但 docker-compose 未找到，手动启动服务..."
    echo "请先安装 docker-compose 或手动运行服务"
    exit 1
else
    echo ""
    echo "Docker 未安装，将使用本地模式启动..."
    echo "注意: 需要先启动 MySQL、Redis、RabbitMQ"
    
    echo ""
    echo "启动后端服务..."
    cd backend
    if [ -f "mvnw" ]; then
        ./mvnw spring-boot:run &
    else
        mvn spring-boot:run &
    fi
    BACKEND_PID=$!
    
    echo ""
    echo "启动前端服务..."
    cd ../frontend
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm dev &
    elif [ -f "yarn.lock" ]; then
        yarn dev &
    else
        npm run dev &
    fi
    FRONTEND_PID=$!
    
    echo ""
    echo "========================================="
    echo "  服务启动中..."
    echo ""
    echo "  后端PID: $BACKEND_PID"
    echo "  前端PID: $FRONTEND_PID"
    echo ""
    echo "  访问地址:"
    echo "  - 前端: http://localhost:${FRONTEND_PORT:-9471}"
    echo "  - 后端API: http://localhost:${SERVER_PORT:-8362}"
    echo ""
    echo "  按 Ctrl+C 停止服务"
    echo "========================================="
    
    wait
fi
