#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89079"
cd "$PROJECT_DIR"

source .env

NODE22_BIN="$HOME/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

echo "=== 启动前端服务 (端口: $FRONTEND_PORT) ==="

# 检查端口占用
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$frontend_pid" ]; then
  cwd=$(lsof -p "$frontend_pid" -a -d cwd -Fn | tail -1 | sed 's/^n//')
  cmd=$(ps -o command= -p "$frontend_pid")
  echo "端口 $FRONTEND_PORT 已被占用: PID=$frontend_pid cwd=$cwd"
  if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
    echo "确认归属当前项目，正在终止旧进程..."
    kill -9 "$frontend_pid"
    sleep 2
  else
    echo "不属于当前项目，尝试备用端口..."
    FRONTEND_PORT=$((41000 + 9079))
    BACKEND_PORT=$((51000 + 9079))
    echo "使用备用端口: FRONTEND=$FRONTEND_PORT, BACKEND=$BACKEND_PORT"
    sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" .env
    sed -i.bak "s/^VITE_API_BASE_URL=.*/VITE_API_BASE_URL=http:\/\/127.0.0.1:$BACKEND_PORT\/api/" .env
    rm -f .env.bak
  fi
fi

# 后台启动前端，确保脱离终端
cd "$PROJECT_DIR"
FRONTEND_PID=$(node "$PROJECT_DIR/scripts/spawn-detached.cjs" "$PROJECT_DIR" "$PROJECT_DIR/frontend.log" "$PROJECT_DIR/frontend.pid" node node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort)
echo "前端启动中，PID: $FRONTEND_PID"

# 等待服务启动
sleep 10

# 验证服务
new_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$new_pid" ]; then
  stat=$(ps -o stat= -p "$new_pid" | xargs)
  echo "前端服务已启动: PID=$new_pid, STATE=$stat"
  if [[ "$stat" == *T* ]]; then
    echo "警告：进程处于停止状态，尝试继续..."
    kill -CONT "$new_pid"
    sleep 2
    stat=$(ps -o stat= -p "$new_pid" | xargs)
    echo "继续后状态: $stat"
  fi
  # 验证HTTP响应
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/")
  echo "HTTP响应码: $http_code"
  if [ "$http_code" = "200" ]; then
    echo "✅ 前端服务验证成功: http://127.0.0.1:$FRONTEND_PORT"
  else
    echo "❌ HTTP验证失败"
    tail -20 frontend.log
  fi
else
  echo "❌ 前端服务启动失败"
  tail -30 frontend.log
  exit 1
fi
