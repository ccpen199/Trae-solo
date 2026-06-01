#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 正在启动低代码审批表单平台..."

if [ ! -d "frontend/dist" ]; then
  echo "📦 首次启动，正在构建前端..."
  cd frontend && npm run build && cd ..
fi

cd backend
node src/server.js
