#!/bin/bash

# 在线考试系统启动脚本

set -e

echo "========================================"
echo "  在线考试系统 - 启动脚本"
echo "========================================"
echo ""

# 端口配置（使用极高端口避免冲突）
SERVER_PORT=28765
CLIENT_PORT=29876
POSTGRES_PORT=25432
REDIS_PORT=26379

echo "端口配置（使用极高端口避免冲突）："
echo "  - 后端API: $SERVER_PORT"
echo "  - 前端: $CLIENT_PORT"
echo "  - PostgreSQL: $POSTGRES_PORT"
echo "  - Redis: $REDIS_PORT"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: 未检测到Docker，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未检测到docker-compose，请先安装docker-compose"
    exit 1
fi

echo "检查Docker状态..."
docker info > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "错误: Docker服务未运行，请先启动Docker"
    exit 1
fi

echo "✅ Docker状态正常"
echo ""

# 检查端口是否被占用
echo "检查端口占用情况..."

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "❌ 错误: 端口 $port 已被占用"
        echo "   请停止占用该端口的进程，或修改 docker-compose.yml 中的端口配置"
        return 1
    else
        echo "✅ 端口 $port 可用"
        return 0
    fi
}

check_port $SERVER_PORT || exit 1
check_port $CLIENT_PORT || exit 1
check_port $POSTGRES_PORT || exit 1
check_port $REDIS_PORT || exit 1

echo ""

# 启动服务
echo "启动Docker服务..."
echo "这可能需要几分钟时间，请耐心等待..."
echo ""

# 构建并启动容器
docker-compose up -d --build

echo ""
echo "等待服务启动完成..."
sleep 15

# 检查容器状态
echo ""
echo "容器状态："
docker-compose ps

echo ""
echo "初始化数据库..."

# 等待PostgreSQL准备就绪
echo "等待PostgreSQL准备就绪..."
for i in {1..30}; do
    if docker exec exam_system_db pg_isready -U exam_admin -d online_exam_system > /dev/null 2>&1; then
        echo "✅ PostgreSQL已就绪"
        break
    fi
    sleep 2
    if [ $i -eq 30 ]; then
        echo "⚠️  PostgreSQL启动超时，请手动检查"
    fi
done

echo ""
echo "========================================"
echo "  服务启动完成！"
echo "========================================"
echo ""
echo "访问地址："
echo "  - 前端页面: http://localhost:$CLIENT_PORT"
echo "  - 后端API: http://localhost:$SERVER_PORT"
echo "  - API健康检查: http://localhost:$SERVER_PORT/api/v1/health"
echo ""
echo "默认账号："
echo "  - 管理员: admin / Admin@123"
echo "  - 出题人: setter01 / Setter@123"
echo "  - 阅卷老师: grader01 / Grader@123"
echo "  - 考生: student01 / Student@123"
echo ""
echo "常用命令："
echo "  - 查看日志: docker-compose logs -f"
echo "  - 停止服务: docker-compose down"
echo "  - 重启服务: docker-compose restart"
echo "  - 重新构建: docker-compose up -d --build"
echo ""
