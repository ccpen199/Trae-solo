#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89079"
cd "$PROJECT_DIR"

chmod +x scripts/start-backend.sh scripts/start-frontend.sh

echo "========================================"
echo "  湖南省社保费税务征缴一体化服务平台"
echo "  启动脚本"
echo "========================================"
echo ""

# 启动后端
./scripts/start-backend.sh
echo ""

# 启动前端
./scripts/start-frontend.sh
echo ""

# 最终验证
source .env
echo "========================================"
echo "  服务启动完成"
echo "========================================"
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "后端API:  http://127.0.0.1:$BACKEND_PORT/api"
echo "前端日志: tail -f frontend.log"
echo "后端日志: tail -f backend.log"
echo ""
echo "测试账号:"
echo "  居民用户: 430101199001011234 / 123456"
echo "  灵活就业: 430101198505055678 / 123456"
echo "  税务管理员: 430101198001019999 / 123456"
echo "  运营管理员: 430101197801018888 / 123456"
echo "========================================"
