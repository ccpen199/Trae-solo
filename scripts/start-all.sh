#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=========================================="
echo "Knowledge Sync 全栈启动"
echo "=========================================="
echo "Project: $PROJECT_DIR"

chmod +x "$PROJECT_DIR/scripts/start-backend.sh"
chmod +x "$PROJECT_DIR/scripts/start-frontend.sh"

if [ ! -f "$PROJECT_DIR/data/app.sqlite" ]; then
  echo "Database not found, initializing test data..."
  python3 "$PROJECT_DIR/scripts/seed-data.py"
fi

"$PROJECT_DIR/scripts/start-backend.sh"
sleep 2
"$PROJECT_DIR/scripts/start-frontend.sh"

sleep 3

source .env

echo ""
echo "=========================================="
echo "服务启动完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端: http://127.0.0.1:$FRONTEND_PORT/"
echo "  后端: http://127.0.0.1:$BACKEND_PORT/"
echo "  API健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
echo "  API文档: http://127.0.0.1:$BACKEND_PORT/docs"
echo ""
echo "主要页面:"
echo "  - 知识条目: http://127.0.0.1:$FRONTEND_PORT/#/entries"
echo "  - 全文检索: http://127.0.0.1:$FRONTEND_PORT/#/search"
echo "  - 同步冲突: http://127.0.0.1:$FRONTEND_PORT/#/conflicts"
echo "  - 分享管理: http://127.0.0.1:$FRONTEND_PORT/#/shares"
echo "  - 统计看板: http://127.0.0.1:$FRONTEND_PORT/#/stats"
echo "  - 管理运营: http://127.0.0.1:$FRONTEND_PORT/#/admin"
echo ""
echo "日志文件:"
echo "  - 后端: $PROJECT_DIR/backend.log"
echo "  - 前端: $PROJECT_DIR/frontend.log"
echo ""
echo "停止服务:"
echo "  kill \$(cat .backend.pid) \$(cat .frontend.pid)"
echo ""
echo "主要文件结构:"
echo "  - 后端API: backend/app/main.py"
echo "  - 数据库模型: backend/app/models.py"
echo "  - 业务逻辑: backend/app/crud.py"
echo "  - 前端入口: frontend/src/App.vue"
echo "  - 前端API: frontend/src/api/index.js"
echo "=========================================="
