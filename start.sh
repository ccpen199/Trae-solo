#!/bin/bash

set -e

echo "========================================"
echo "  体检中心管理系统 - 启动脚本"
echo "========================================"

echo ""
echo "检查环境变量配置..."
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
fi

echo ""
echo "检查 Node.js 版本..."
node --version

echo ""
echo "安装依赖..."
npm install

echo ""
echo "启动数据库服务 (Docker)..."
if command -v docker &> /dev/null; then
    docker-compose up -d postgres redis
    echo "等待数据库就绪..."
    sleep 10
else
    echo "⚠️  Docker 未安装，请确保 PostgreSQL 和 Redis 已在本地运行"
    echo "⚠️  数据库配置请查看 .env 文件"
fi

echo ""
echo "启动后端服务 (端口: 18443)..."
echo "  - API 服务: http://localhost:18443"
echo "  - Socket 服务: http://localhost:18444"
echo ""
echo "默认账号:"
echo "  - 管理员: admin / Admin123!"
echo "  - 前台: reception1 / Admin123!"
echo "  - 医生: doctor1 / Admin123!"
echo "  - 总检: chief1 / Admin123!"
echo ""
echo "========================================"
echo "服务已启动!"
echo "========================================"
echo ""
echo "如需启动前端服务，请执行以下命令:"
echo "  - 客户Web端: npm run dev:client (端口: 18445)"
echo "  - 前台端: npm run dev:reception (端口: 18446)"
echo "  - 医生端: npm run dev:doctor (端口: 18447)"
echo "  - 大屏端: npm run dev:dashboard (端口: 18448)"
echo ""
echo "或一键启动所有服务: npm run dev"
echo ""

npm run dev:backend
