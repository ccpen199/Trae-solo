#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89079"
cd "$PROJECT_DIR"

source .env

NODE22_BIN="$HOME/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

echo "=== 启动后端服务 (端口: $BACKEND_PORT) ==="

# 检查端口占用
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  cwd=$(lsof -p "$backend_pid" -a -d cwd -Fn | tail -1 | sed 's/^n//')
  cmd=$(ps -o command= -p "$backend_pid")
  echo "端口 $BACKEND_PORT 已被占用: PID=$backend_pid cwd=$cwd"
  if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
    echo "确认归属当前项目，正在终止旧进程..."
    kill -9 "$backend_pid"
    sleep 2
  else
    echo "不属于当前项目，尝试备用端口..."
    BACKEND_PORT=$((51000 + 9079))
    FRONTEND_PORT=$((41000 + 9079))
    echo "使用备用端口: FRONTEND=$FRONTEND_PORT, BACKEND=$BACKEND_PORT"
    sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" .env
    sed -i.bak "s/^PORT=.*/PORT=$BACKEND_PORT/" .env
    sed -i.bak "s/^CORS_ORIGIN=.*/CORS_ORIGIN=http:\/\/127.0.0.1:$FRONTEND_PORT/" .env
    rm -f .env.bak
  fi
fi

# 初始化数据库
echo "=== 初始化数据库 ==="
node --import tsx/esm --env-file=.env -e "import { initDatabase } from './api/db.ts'; initDatabase();"

# 后台启动后端
cd "$PROJECT_DIR"
BACKEND_PID=$(node "$PROJECT_DIR/scripts/spawn-detached.cjs" "$PROJECT_DIR" "$PROJECT_DIR/backend.log" "$PROJECT_DIR/backend.pid" node --import tsx/esm --env-file=.env api/server.ts)
echo "后端启动中，PID: $BACKEND_PID"

# 等待服务启动
sleep 8

# 验证服务
new_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$new_pid" ]; then
  stat=$(ps -o stat= -p "$new_pid" | xargs)
  echo "后端服务已启动: PID=$new_pid, STATE=$stat"
  # 验证健康检查
  response=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
  echo "健康检查响应: $response"
  if echo "$response" | grep -q '"success":true'; then
    echo "✅ 后端服务验证成功: http://127.0.0.1:$BACKEND_PORT"
  else
    echo "❌ 健康检查失败"
    tail -20 backend.log
  fi
else
  echo "❌ 后端服务启动失败"
  tail -30 backend.log
  exit 1
fi
