#!/bin/bash

echo "========================================="
echo "冷链物流温控平台 - 环境初始化脚本"
echo "========================================="

echo ""
echo "[1/5] 检查Docker环境..."
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "Docker环境检查完成"

echo ""
echo "[2/5] 检查端口可用性..."

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo "端口 $port 已被占用"
        return 1
    else
        echo "端口 $port 可用"
        return 0
    fi
}

# 检查关键端口
PORTS=(8080 8081 8082 5432 6379 5672 15672)
for port in "${PORTS[@]}"; do
    check_port $port
    if [ $? -ne 0 ]; then
        echo "请释放端口 $port 后重新运行脚本"
        exit 1
    fi
done

echo "所有端口检查完成"

echo ""
echo "[3/5] 启动中间件服务 (PostgreSQL, Redis, RabbitMQ)..."
docker-compose up -d postgres redis rabbitmq

echo "等待中间件服务启动..."
sleep 15

echo ""
echo "[4/5] 初始化数据库..."
docker exec -it coldchain-postgres psql -U coldchain -d coldchain -c "CREATE USER coldchain WITH PASSWORD 'coldchain123';" || true
docker exec -it coldchain-postgres psql -U coldchain -d coldchain -c "CREATE DATABASE coldchain OWNER coldchain;" || true
docker exec -it coldchain-postgres psql -U coldchain -d coldchain -c "GRANT ALL PRIVILEGES ON DATABASE coldchain TO coldchain;" || true

echo "数据库初始化完成"

echo ""
echo "[5/5] 构建后端服务..."
cd backend
mvn clean package -DskipTests
cd ..

echo ""
echo "[6/6] 构建前端服务..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "========================================="
echo "环境初始化完成!"
echo "========================================="
echo ""
echo "启动服务:"
echo "  后端: cd backend && mvn spring-boot:run"
echo "  前端: cd frontend && npm run dev"
echo ""
echo "或者使用Docker Compose启动所有服务:"
echo "  docker-compose up -d"
echo ""
echo "默认端口:"
echo "  前端: http://localhost:8081"
echo "  后端: http://localhost:8080"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo "  RabbitMQ: localhost:5672"
echo "  RabbitMQ Management: http://localhost:15672"
echo ""
echo "默认账号:"
echo "  PostgreSQL: coldchain / coldchain123"
echo "  RabbitMQ: guest / guest"
