#!/bin/bash

# 在线考试系统停止脚本

echo "========================================"
echo "  在线考试系统 - 停止脚本"
echo "========================================"
echo ""

# 检查Docker Compose文件是否存在
if [ ! -f "docker-compose.yml" ]; then
    echo "错误: 未找到 docker-compose.yml 文件"
    echo "请在项目根目录下运行此脚本"
    exit 1
fi

echo "正在停止所有服务..."
docker-compose down

echo ""
echo "✅ 所有服务已停止"
echo ""
echo "如果需要保留数据，请不要执行 docker-compose down -v"
echo "如果需要完全清除数据（包括数据库），请执行: docker-compose down -v"
