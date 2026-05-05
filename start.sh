#!/bin/bash

# ERP系统启动脚本
# 端口说明:
# - 后端端口: 12227 (项目号xm-12227取后四位2227，前缀1)
# - 前端端口: 22271 (后缀1)

set -e

echo "========================================"
echo "        ERP System 启动脚本"
echo "========================================"
echo ""

# 创建日志目录
mkdir -p logs

# 检查 PostgreSQL 是否安装和运行
echo "检查 PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "  PostgreSQL 已安装"
else
    echo "  警告: PostgreSQL 未安装，请先安装 PostgreSQL"
    echo "  安装命令 (macOS): brew install postgresql"
    echo "  启动命令: brew services start postgresql"
fi

echo ""

# 进入后端目录
cd backend

# 安装后端依赖
echo "安装后端依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi
echo "  后端依赖安装完成"

# 生成 Prisma 客户端
echo "生成 Prisma 客户端..."
npx prisma generate
echo "  Prisma 客户端生成完成"

# 检查数据库
echo "检查数据库..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_system?schema=public"

# 尝试创建数据库
if psql -U postgres -c "SELECT 1" &> /dev/null; then
    if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "erp_system"; then
        echo "  创建数据库 erp_system..."
        psql -U postgres -c "CREATE DATABASE erp_system;"
    else
        echo "  数据库 erp_system 已存在"
    fi
else
    echo "  警告: 无法连接 PostgreSQL，请确保 PostgreSQL 正在运行"
    echo "  默认连接信息: postgres://postgres:postgres@localhost:5432/erp_system"
fi

echo ""

# 运行数据库迁移
echo "运行数据库迁移..."
npx prisma migrate dev --name init --skip-seed 2>/dev/null || true
echo "  数据库迁移完成"

# 运行种子数据
echo "初始化种子数据..."
npx tsx src/scripts/seed.ts
echo "  种子数据初始化完成"

echo ""

# 编译后端
echo "编译后端..."
npm run build
echo "  后端编译完成"

# 启动后端服务
echo "启动后端服务 (端口: 12227)..."
cd ..
nohup node backend/dist/index.js > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "  后端服务已启动，PID: $BACKEND_PID"
echo "  日志文件: logs/backend.log"

echo ""

# 启动前端服务
cd frontend
echo "安装前端依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi
echo "  前端依赖安装完成"

echo ""

echo "启动前端服务 (端口: 22271)..."
cd ..
nohup npx vite --port 22271 > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  前端服务已启动，PID: $FRONTEND_PID"
echo "  日志文件: logs/frontend.log"

echo ""
echo "========================================"
echo "            启动完成!"
echo "========================================"
echo ""
echo "访问地址:"
echo "  前端: http://localhost:22271"
echo "  后端 API: http://localhost:12227/api"
echo "  健康检查: http://localhost:12227/health"
echo ""
echo "默认账号:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "进程信息:"
echo "  后端 PID: $BACKEND_PID"
echo "  前端 PID: $FRONTEND_PID"
echo ""
echo "停止命令:"
echo "  停止后端: kill $BACKEND_PID"
echo "  停止前端: kill $FRONTEND_PID"
echo "  或直接: pkill -f 'node backend/dist'"
echo "           pkill -f 'vite'"
echo ""
