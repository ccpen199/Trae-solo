#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-88933"
FRONTEND_PORT=48933
BACKEND_PORT=58933
NODE_HOME="${NODE_HOME:-/Users/chen/.nvm/versions/node/v22.22.0}"

if [ -x "$NODE_HOME/bin/npm" ]; then
  export PATH="$NODE_HOME/bin:$PATH"
fi

echo "========================================="
echo "1. 重启后端服务"
echo "========================================="
pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$pid" ]; then
  cwd=$(lsof -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-)
  if [[ "$cwd" == *"$PROJECT_DIR"* ]]; then
    kill "$pid"
    echo "已终止旧后端 PID: $pid"
    sleep 2
  fi
fi

cd "$PROJECT_DIR/backend"
nohup node src/index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "后端启动 PID: $BACKEND_PID"
disown
sleep 7

echo ""
echo "========================================="
echo "2. 后端三重验证"
echo "========================================="
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  echo "✅ 后端端口 $BACKEND_PORT 监听正常，PID: $backend_pid"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
  backend_stat=$(ps -o stat= -p "$backend_pid" | xargs)
  if [[ "$backend_stat" == *"T"* ]] || [[ "$backend_stat" == *"Z"* ]]; then
    echo "❌ 进程状态异常: $backend_stat"
    exit 1
  else
    echo "✅ 后端进程状态正常: $backend_stat"
  fi
  HEALTH=$(curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health)
  echo "✅ 健康检查: $HEALTH"
else
  echo "❌ 后端端口未监听"
  echo "后端日志:"
  tail -50 "$PROJECT_DIR/backend.log"
  exit 1
fi

echo ""
echo "========================================="
echo "3. 前端状态检查"
echo "========================================="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$frontend_pid" ]; then
  echo "✅ 前端端口 $FRONTEND_PORT 监听正常，PID: $frontend_pid"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
  frontend_stat=$(ps -o stat= -p "$frontend_pid" | xargs)
  if [[ "$frontend_stat" == *"T"* ]] || [[ "$frontend_stat" == *"Z"* ]]; then
    echo "❌ 进程状态异常: $frontend_stat"
    exit 1
  else
    echo "✅ 前端进程状态正常: $frontend_stat"
  fi
  HTTP_CODE=$(curl -I --max-time 5 -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$FRONTEND_PORT/)
  echo "✅ 前端HTTP状态码: $HTTP_CODE"
else
  echo "⚠️  前端未启动，正在启动..."
  cd "$PROJECT_DIR/frontend"
  nohup npm run dev > ../frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo "前端启动 PID: $FRONTEND_PID"
  disown
  sleep 10
  frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
  if [ -n "$frontend_pid" ]; then
    echo "✅ 前端启动成功，PID: $frontend_pid"
    HTTP_CODE=$(curl -I --max-time 5 -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$FRONTEND_PORT/)
    echo "✅ 前端HTTP状态码: $HTTP_CODE"
  else
    echo "❌ 前端启动失败"
    echo "前端日志:"
    tail -50 "$PROJECT_DIR/frontend.log"
    exit 1
  fi
fi

echo ""
echo "========================================="
echo "4. 主业务链路API测试"
echo "========================================="
cd "$PROJECT_DIR"
python3 test-flow.py 2>&1
TEST_EXIT=$?

echo ""
echo "========================================="
echo "5. 最终结果"
echo "========================================="
if [ $TEST_EXIT -eq 0 ]; then
  echo "✅✅✅ 全部验证通过！✅✅✅"
  echo ""
  echo "访问地址:"
  echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
  echo "  后端: http://127.0.0.1:$BACKEND_PORT"
  echo ""
  echo "测试账号:"
  echo "  货主: shipper01 / shipper123"
  echo "  司机: driver01 / driver123"
  echo "  司机: driver02 / driver123"
  echo "  管理员: admin / admin123456"
else
  echo "❌ 业务链路测试失败"
  exit 1
fi
