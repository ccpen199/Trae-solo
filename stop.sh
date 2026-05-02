#!/bin/bash

echo "========================================="
echo "  外卖聚合接单系统 - 停止脚本"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f "docker-compose.yml" ] && command -v docker-compose >/dev/null 2>&1; then
    echo "停止 Docker 容器..."
    docker-compose down
    
    echo ""
    echo "是否删除数据卷? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "删除数据卷..."
        docker-compose down -v
    fi
    
    echo ""
    echo "✓ 服务已停止"
else
    echo "查找并停止运行中的服务进程..."
    
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "node.*vite" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    
    echo ""
    echo "✓ 服务已停止"
fi
