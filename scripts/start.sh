#!/bin/bash
# 婚庆供应商撮合平台 - 启动脚本
# 项目: may-63471 | 端口: 前端43471 / 后端53471

set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# 读取端口配置
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43471}
BACKEND_PORT=${BACKEND_PORT:-53471}
HOST=${HOST:-127.0.0.1}

echo "==========================================="
echo "  婚庆供应商撮合平台 - 启动服务"
echo "  项目目录: $PROJECT_DIR"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo "==========================================="

# 端口检查函数
check_port() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(lsof -p "$pid" 2>/dev/null | awk '$4=="cwd"{print $9}')
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    echo "端口 $port 被 PID=$pid 占用"
    echo "  cwd: $cwd"
    echo "  cmd: $cmd"
    # 检查是否属于当前项目
    if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
      echo "  归属当前项目，准备终止..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      # 再次检查
      if lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  强制终止 PID=$pid"
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
      fi
    else
      echo "  不属于当前项目，尝试切换备用端口..."
      try_backup_ports
      return 1
    fi
  fi
  return 0
}

# 备用端口尝试
try_backup_ports() {
  local tail4=3471
  local slots=(0 1 2 3 4 5)
  for slot in "${slots[@]}"; do
    local fp=$((40000 + slot * 1000 + tail4))
    local bp=$((50000 + slot * 1000 + tail4))
    echo "  尝试槽位 $slot: 前端$fp / 后端$bp"
    if ! lsof -nP -iTCP:$fp -sTCP:LISTEN -t >/dev/null 2>&1 && \
       ! lsof -nP -iTCP:$bp -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "  槽位 $slot 可用，更新 .env..."
      sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$fp/" .env
      sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$bp/" .env
      sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://$HOST:$bp/api|" .env
      sed -i '' "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://$HOST:$bp/api|" .env
      sed -i '' "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://$HOST:$fp|" .env
      export FRONTEND_PORT=$fp
      export BACKEND_PORT=$bp
      echo "  端口已更新为: 前端$fp / 后端$bp"
      return 0
    fi
  done
  echo "ERROR: 所有端口槽位均被占用，请手动释放端口后重试"
  exit 1
}

# 检查并清理端口
check_port $FRONTEND_PORT || true
check_port $BACKEND_PORT || true

echo ""
echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup node server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/backend.pid"
echo "  后端 PID: $BACKEND_PID"

echo ""
echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
nohup node server.js > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_DIR/frontend.pid"
echo "  前端 PID: $FRONTEND_PID"

echo ""
echo "等待服务启动 (5秒)..."
sleep 5

echo ""
echo "==========================================="
echo "  服务启动检查"
echo "==========================================="

# 检查后端
echo ""
echo "[1/4] 检查后端端口监听..."
if lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "  ✅ 后端端口 $BACKEND_PORT 监听正常"
else
  echo "  ❌ 后端端口 $BACKEND_PORT 未监听"
fi

echo "[2/4] 检查后端进程状态..."
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$backend_pid" ]; then
  stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  if [[ "$stat" != *T* && "$stat" != *Z* ]]; then
    echo "  ✅ 后端进程正常 (stat=$stat)"
  else
    echo "  ❌ 后端进程异常 (stat=$stat)"
  fi
fi

echo "[3/4] 检查后端健康接口..."
if curl -sS --max-time 5 "http://$HOST:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
  echo "  ✅ 后端健康接口正常"
  health_data=$(curl -sS --max-time 5 "http://$HOST:$BACKEND_PORT/api/health" 2>/dev/null)
  echo "     $health_data"
else
  echo "  ❌ 后端健康接口请求失败"
fi

# 检查前端
echo "[4/4] 检查前端..."
if lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "  ✅ 前端端口 $FRONTEND_PORT 监听正常"
  if curl -sS --max-time 5 -I "http://$HOST:$FRONTEND_PORT/" 2>&1 | grep -q 'HTTP/.* 200'; then
    echo "  ✅ 前端首页返回 200 OK"
  else
    echo "  ⚠️  前端首页未返回 200"
  fi
else
  echo "  ❌ 前端端口 $FRONTEND_PORT 未监听"
fi

echo ""
echo "==========================================="
echo "  服务已启动!"
echo "  前端: http://$HOST:$FRONTEND_PORT"
echo "  后端: http://$HOST:$BACKEND_PORT"
echo "  健康: http://$HOST:$BACKEND_PORT/api/health"
echo "==========================================="
echo ""
echo "日志文件:"
echo "  前端: $PROJECT_DIR/frontend.log"
echo "  后端: $PROJECT_DIR/backend.log"
echo ""
echo "停止服务: ./scripts/stop.sh"
echo "检查状态: ./scripts/verify.sh"
