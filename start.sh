#!/bin/bash

echo "========================================"
echo "  医院预约挂号系统 - 启动脚本"
echo "========================================"
echo ""

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "[1/7] 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，当前版本: $(node -v)，需要 >= 18.0.0"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi
echo "✅ npm 版本: $(npm -v)"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker 和 Docker Compose"
    exit 1
fi
echo "✅ Docker 已安装"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi
echo "✅ Docker Compose 已安装"
echo ""

echo "[2/7] 检查端口配置..."
echo "  后端端口: 8247"
echo "  前端端口: 9358"
echo "  数据库端口: 5433"
echo "  Redis 端口: 6380"
echo "  WebSocket 端口: 8248"
echo ""

echo "[3/7] 安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装项目依赖..."
    npm install
else
    echo "依赖已存在，跳过安装"
fi
echo ""

echo "[4/7] 启动基础设施服务 (PostgreSQL + Redis)..."
if docker compose ps --format '{{.Status}}' | grep -q "running"; then
    echo "基础设施服务已在运行中"
else
    echo "启动 Docker 容器..."
    docker compose up -d
    echo "等待服务就绪..."
    sleep 5
fi

MAX_RETRIES=30
RETRY_COUNT=0
DB_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose exec -T postgres pg_isready -U hospital -d hospital -h localhost -p 5432 &> /dev/null; then
        DB_READY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  等待数据库就绪... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ "$DB_READY" = false ]; then
    echo "❌ 数据库启动超时，请检查 Docker 容器状态"
    exit 1
fi
echo "✅ 数据库已就绪"
echo ""

echo "[5/7] 生成 Prisma 客户端..."
npm run db:prisma:generate
echo ""

echo "[6/7] 运行数据库迁移..."
if ! npm run db:prisma:migrate; then
    echo "⚠️  迁移命令可能失败，尝试创建数据库..."
fi
echo ""

echo "[7/7] 填充种子数据..."
npm run db:prisma:seed
echo ""

echo "========================================"
echo "  启动完成!"
echo "========================================"
echo ""
echo "服务地址:"
echo "  前端: http://localhost:9358"
echo "  后端 API: http://localhost:8247/api"
echo "  Swagger 文档: http://localhost:8247/api"
echo ""
echo "测试账号:"
echo "  管理员: admin / admin123"
echo "  医生: doctor1 / doctor123"
echo "  护士: nurse1 / nurse123"
echo "  挂号员: registrar1 / registrar123"
echo "  患者: patient1 / patient123"
echo ""
echo "可用命令:"
echo "  npm run dev:backend   - 启动后端服务"
echo "  npm run dev:frontend  - 启动前端服务"
echo "  npm run dev           - 同时启动前后端服务"
echo "  npm run db:stop       - 停止数据库服务"
echo "  npm run db:prisma:studio - 打开数据库管理界面"
echo ""
echo "正在启动开发服务器..."
echo ""

npm run dev
