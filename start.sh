#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env

NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"

echo "=========================================="
echo "猎头生态型人才协作平台 - 启动脚本"
echo "=========================================="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

echo "检查端口占用..."
for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    pid_info=$(ps -p "$pid" -o pid=,ppid=,stat=,args= 2>/dev/null || true)
    pid_cwd=$(lsof -a -p "$pid" -d cwd -F n 2>/dev/null | tail -1 | sed 's/^n//' || true)
    
    if [[ "$pid_cwd" == "$PROJECT_DIR"* ]] || [[ "$pid_info" == *"$PROJECT_DIR"* ]]; then
      echo "  端口 $PORT 被当前项目进程占用 (PID=$pid)，终止..."
      kill "$pid" 2>/dev/null || true
      sleep 0.5
    else
      echo "  端口 $PORT 被外部进程占用 (PID=$pid)，归属不明，跳过终止"
      echo "  进程信息: $pid_info"
      echo "  工作目录: $pid_cwd"
      
      TAIL4=9069
      SLOT=1
      while [ $SLOT -le 5 ]; do
        NEW_FPORT=$((40000 + SLOT * 1000 + TAIL4))
        NEW_BPORT=$((50000 + SLOT * 1000 + TAIL4))
        
        fpid=$(lsof -nP -iTCP:$NEW_FPORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
        bpid=$(lsof -nP -iTCP:$NEW_BPORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
        
        if [ -z "$fpid" ] && [ -z "$bpid" ]; then
          echo "  使用备用槽位 $SLOT: FRONTEND=$NEW_FPORT, BACKEND=$NEW_BPORT"
          export FRONTEND_PORT=$NEW_FPORT
          export BACKEND_PORT=$NEW_BPORT
          
          sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$NEW_FPORT/" .env
          sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$NEW_BPORT/" .env
          sed -i '' "s|^API_BASE_URL=http://127.0.0.1:[0-9]*/api|API_BASE_URL=http://127.0.0.1:$NEW_BPORT/api|" .env
          sed -i '' "s|^VITE_API_BASE_URL=http://127.0.0.1:[0-9]*/api|VITE_API_BASE_URL=http://127.0.0.1:$NEW_BPORT/api|" .env
          sed -i '' "s|^CORS_ORIGIN=http://127.0.0.1:[0-9]*|CORS_ORIGIN=http://127.0.0.1:$NEW_FPORT|" .env
          
          source .env
          break
        fi
        SLOT=$((SLOT + 1))
      done
      
      if [ $SLOT -gt 5 ]; then
        echo "❌ 所有端口槽位均被占用，请手动释放端口后重试"
        exit 1
      fi
    fi
  fi
done

echo ""
echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup "$NODE_BIN" src/server.js > "$PROJECT_DIR/backend.log" 2>&1 < /dev/null &!
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

echo ""
echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
nohup "$NODE_BIN" ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 < /dev/null &!
FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

echo ""
echo "等待服务启动 (8秒)..."
sleep 8

echo ""
echo "=========================================="
echo "服务状态检查"
echo "=========================================="

echo ""
echo "后端端口 $BACKEND_PORT 监听检查:"
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$backend_pid" ]; then
  echo "  ✅ 端口监听正常，PID=$backend_pid"
  ps -p "$backend_pid" -o pid=,stat=,args=
else
  echo "  ❌ 端口未监听"
fi

echo ""
echo "前端端口 $FRONTEND_PORT 监听检查:"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$frontend_pid" ]; then
  echo "  ✅ 端口监听正常，PID=$frontend_pid"
  ps -p "$frontend_pid" -o pid=,stat=,args=
else
  echo "  ❌ 端口未监听"
fi

echo ""
echo "后端健康检查:"
backend_status=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 || echo "000")
if [ "$backend_status" = "200" ]; then
  echo "  ✅ HTTP 200 OK"
  curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
else
  echo "  ❌ HTTP $backend_status"
fi

echo ""
echo "前端首页检查:"
frontend_status=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:$FRONTEND_PORT/ 2>&1 || echo "000")
if [ "$frontend_status" = "200" ]; then
  echo "  ✅ HTTP 200 OK"
else
  echo "  ❌ HTTP $frontend_status"
fi

echo ""
echo "=========================================="
echo "🎉 服务启动完成!"
echo "=========================================="
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "后端地址: http://127.0.0.1:$BACKEND_PORT"
echo "健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "测试账号:"
echo "  管理员: admin / admin123"
echo "  猎头用户: headhunter1 / 123456"
echo "  企业用户: hr_company1 / 123456"
echo ""
echo "日志文件:"
echo "  后端: $PROJECT_DIR/backend.log"
echo "  前端: $PROJECT_DIR/frontend.log"
echo ""
echo "停止命令:"
echo "  cd $PROJECT_DIR && ./stop.sh"
echo "=========================================="
