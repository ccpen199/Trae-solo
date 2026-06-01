#!/bin/bash
# 机场行李追踪系统 - 启动脚本
# 启动前后端服务（后台运行，关闭终端不影响）

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 加载环境变量
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43445}
BACKEND_PORT=${BACKEND_PORT:-53445}

echo "=========================================="
echo "机场行李追踪系统 - 启动脚本"
echo "=========================================="
echo ""
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

# 定义端口检查函数
check_port() {
  local PORT=$1
  local PID=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
  
  if [ -n "$PID" ]; then
    local CWD=$(ps -o cwd= -p "$PID" | xargs 2>/dev/null || echo "")
    local CMD=$(ps -o command= -p "$PID" 2>/dev/null || echo "")
    
    # 检查是否属于当前项目
    case "$CWD" in
      "$PROJECT_DIR"*)
        echo "端口 $PORT 被当前项目进程占用 (PID: $PID)"
        echo "  CWD: $CWD"
        echo "  CMD: $CMD"
        echo "正在终止该进程..."
        kill "$PID"
        sleep 2
        # 再次检查
        if lsof -nP -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
          echo "强制终止..."
          kill -9 "$PID" 2>/dev/null || true
          sleep 1
        fi
        ;;
      *)
        echo "端口 $PORT 被非本项目进程占用 (PID: $PID)"
        echo "  CWD: $CWD"
        echo "  CMD: $CMD"
        echo "根据进程隔离约束，不终止该进程，将尝试备用端口..."
        return 1
        ;;
    esac
  fi
  return 0
}

# 尝试找到可用端口
SLOT=0
while true; do
  if [ $SLOT -eq 0 ]; then
    CURRENT_FRONTEND=$((40000 + TAIL4))
    CURRENT_BACKEND=$((50000 + TAIL4))
  else
    CURRENT_FRONTEND=$((40000 + SLOT * 1000 + TAIL4))
    CURRENT_BACKEND=$((50000 + SLOT * 1000 + TAIL4))
  fi
  
  if [ $SLOT -gt 5 ]; then
    echo "所有端口槽位已被占用，无法启动！"
    echo "请手动释放端口或修改 .env 文件"
    exit 1
  fi
  
  echo "检查端口槽位 $SLOT: $CURRENT_FRONTEND / $CURRENT_BACKEND"
  
  if check_port $CURRENT_FRONTEND && check_port $CURRENT_BACKEND; then
    if [ $SLOT -gt 0 ]; then
      # 更新 .env 文件
      echo "更新 .env 文件，使用备用端口..."
      sed -i.bak \
        -e "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$CURRENT_FRONTEND/" \
        -e "s/^BACKEND_PORT=.*/BACKEND_PORT=$CURRENT_BACKEND/" \
        -e "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$CURRENT_BACKEND/api|" \
        .env
      rm -f .env.bak
      
      # 重新加载环境变量
      export $(cat .env | grep -v '^#' | xargs)
      FRONTEND_PORT=$CURRENT_FRONTEND
      BACKEND_PORT=$CURRENT_BACKEND
    fi
    break
  fi
  
  SLOT=$((SLOT + 1))
done

echo ""
echo "使用端口：前端 $FRONTEND_PORT，后端 $BACKEND_PORT"
echo ""

# 启动后端服务
echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup node src/server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端进程 PID: $BACKEND_PID"

# 启动前端服务
echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
nohup npx vite --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端进程 PID: $FRONTEND_PID"

echo ""
echo "等待服务启动 (5秒)..."
sleep 5

# 验证后端
echo ""
echo "验证后端服务..."
BACKEND_LISTEN=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$BACKEND_LISTEN" ]; then
  echo "✓ 后端端口 $BACKEND_PORT 监听正常 (PID: $BACKEND_LISTEN)"
  
  # 检查进程状态
  BACKEND_STAT=$(ps -o stat= -p $BACKEND_LISTEN 2>/dev/null | xargs || echo "")
  if [ "$BACKEND_STAT" = "T" ] || [ "$BACKEND_STAT" = "Z" ]; then
    echo "✗ 后端进程状态异常: $BACKEND_STAT"
    exit 1
  fi
  
  # 健康检查
  HEALTH=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1)
  if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✓ 后端健康检查通过"
    echo "  $HEALTH"
  else
    echo "✗ 后端健康检查失败: $HEALTH"
  fi
else
  echo "✗ 后端端口 $BACKEND_PORT 未监听"
  echo "后端日志最后10行:"
  tail -10 "$PROJECT_DIR/backend.log"
fi

# 验证前端
echo ""
echo "验证前端服务..."
FRONTEND_LISTEN=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$FRONTEND_LISTEN" ]; then
  echo "✓ 前端端口 $FRONTEND_PORT 监听正常 (PID: $FRONTEND_LISTEN)"
  
  # 检查进程状态
  FRONTEND_STAT=$(ps -o stat= -p $FRONTEND_LISTEN 2>/dev/null | xargs || echo "")
  if [ "$FRONTEND_STAT" = "T" ] || [ "$FRONTEND_STAT" = "Z" ]; then
    echo "✗ 前端进程状态异常: $FRONTEND_STAT"
    exit 1
  fi
  
  # 访问前端首页
  HTTP_CODE=$(curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>/dev/null | head -n1 | awk '{print $2}')
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 前端首页访问正常 (HTTP $HTTP_CODE)"
  else
    echo "✗ 前端首页访问异常 (HTTP $HTTP_CODE)"
    echo "前端日志最后10行:"
    tail -10 "$PROJECT_DIR/frontend.log"
  fi
else
  echo "✗ 前端端口 $FRONTEND_PORT 未监听"
  echo "前端日志最后10行:"
  tail -10 "$PROJECT_DIR/frontend.log"
fi

echo ""
echo "=========================================="
echo "启动完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  旅客查询: http://127.0.0.1:$FRONTEND_PORT/track"
echo "  管理后台: http://127.0.0.1:$FRONTEND_PORT/admin/dashboard"
echo "  后端健康: http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "进程信息："
echo "  前端 PID: $FRONTEND_PID, 端口: $FRONTEND_PORT"
echo "  后端 PID: $BACKEND_PID, 端口: $BACKEND_PORT"
echo ""
echo "日志文件："
echo "  前端日志: $PROJECT_DIR/frontend.log"
echo "  后端日志: $PROJECT_DIR/backend.log"
echo ""
echo "停止服务："
echo "  执行 ./stop.sh 或使用以下命令："
echo "  kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo "运行测试："
echo "  bash test_samples.sh"
echo ""
cd "$PROJECT_DIR"
