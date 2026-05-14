#!/bin/bash
echo "🚀 启动云集电商平台..."

cd backend
echo "📦 启动后端 (端口 9893)..."
node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端 PID: $BACKEND_PID"

cd ../frontend
echo "🎨 启动前端 (端口 9892)..."
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端 PID: $FRONTEND_PID"

echo ""
echo "====================================="
echo "✅ 服务已启动！"
echo "🌐 前端地址: http://localhost:9892"
echo "🔧 后端地址: http://localhost:9893"
echo "====================================="
echo ""
echo "💡 测试登录时，验证码输入 123456 即可"
echo ""

# 保存 PID
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

# 保持脚本运行，同时监控进程
wait $BACKEND_PID $FRONTEND_PID
