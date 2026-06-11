#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

TAIL4=9097
SLOT=0

find_available_ports() {
  local slot=$1
  local frontend_base=$((40000 + slot * 1000))
  local backend_base=$((50000 + slot * 1000))
  local frontend_port=$((frontend_base + TAIL4))
  local backend_port=$((backend_base + TAIL4))
  
  local frontend_pid=$(lsof -nP -iTCP:$frontend_port -sTCP:LISTEN -t | head -n1)
  local backend_pid=$(lsof -nP -iTCP:$backend_port -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$frontend_pid" ] && [ -z "$backend_pid" ]; then
    echo "$frontend_port $backend_port"
    return 0
  fi
  
  if [ -n "$frontend_pid" ]; then
    local cwd=$(ps -o cwd= -p "$frontend_pid" 2>/dev/null | xargs)
    case "$cwd" in
      "$PROJECT_DIR"/*) kill "$frontend_pid" 2>/dev/null || true; sleep 1 ;;
    esac
  fi
  
  if [ -n "$backend_pid" ]; then
    local cwd=$(ps -o cwd= -p "$backend_pid" 2>/dev/null | xargs)
    case "$cwd" in
      "$PROJECT_DIR"/*) kill "$backend_pid" 2>/dev/null || true; sleep 1 ;;
    esac
  fi
  
  local frontend_pid2=$(lsof -nP -iTCP:$frontend_port -sTCP:LISTEN -t | head -n1)
  local backend_pid2=$(lsof -nP -iTCP:$backend_port -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$frontend_pid2" ] && [ -z "$backend_pid2" ]; then
    echo "$frontend_port $backend_port"
    return 0
  fi
  
  return 1
}

update_env_ports() {
  local frontend_port=$1
  local backend_port=$2
  
  sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" "$PROJECT_DIR/.env"
  sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" "$PROJECT_DIR/.env"
  sed -i.bak "s/^APP_PORT=.*/APP_PORT=$frontend_port/" "$PROJECT_DIR/.env"
  sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" "$PROJECT_DIR/.env"
  sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" "$PROJECT_DIR/.env"
  sed -i.bak "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$PROJECT_DIR/.env"
  sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$backend_port/api|" "$PROJECT_DIR/.env"
  sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$frontend_port|" "$PROJECT_DIR/.env"
  rm -f "$PROJECT_DIR/.env.bak"
  
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
}

echo "=== 项目启动 ==="
echo "项目目录: $PROJECT_DIR"

FOUND_PORTS=0
for slot in 0 1 2 3 4 5; do
  echo "尝试槽位 $slot..."
  PORTS=$(find_available_ports $slot) && {
    FRONTEND_PORT=$(echo $PORTS | cut -d' ' -f1)
    BACKEND_PORT=$(echo $PORTS | cut -d' ' -f2)
    FOUND_PORTS=1
    if [ $slot -gt 0 ]; then
      echo "使用备用槽位 $slot: 前端=$FRONTEND_PORT, 后端=$BACKEND_PORT"
      update_env_ports $FRONTEND_PORT $BACKEND_PORT
    else
      echo "使用默认端口: 前端=$FRONTEND_PORT, 后端=$BACKEND_PORT"
    fi
    break
  }
done

if [ "$FOUND_PORTS" -eq 0 ]; then
  echo "错误: 所有端口槽位均被占用，请手动释放端口后重试。"
  exit 1
fi

mkdir -p "$PROJECT_DIR/logs"

echo "启动后端服务..."
cd "$PROJECT_DIR"
if [ -f "backend/package.json" ]; then
  cd "$PROJECT_DIR/backend"
  nohup npm run start -- --host 127.0.0.1 --port $BACKEND_PORT > "$PROJECT_DIR/logs/backend.log" 2>&1 &
elif [ -f "package.json" ] && grep -q '"start"' "package.json" && ! grep -q '"dev"' "package.json" | grep -q vite; then
  nohup npm run start -- --host 127.0.0.1 --port $BACKEND_PORT > "$PROJECT_DIR/logs/backend.log" 2>&1 &
fi

echo "启动前端服务..."
cd "$PROJECT_DIR"
if [ -f "frontend/package.json" ]; then
  cd "$PROJECT_DIR/frontend"
  nohup npm run dev -- --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
elif [ -f "package.json" ] && grep -q '"dev"' "package.json"; then
  nohup npm run dev -- --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
fi

echo "等待服务启动..."
sleep 5

echo ""
echo "=== 启动状态检查 ==="
"$SCRIPT_DIR/verify.sh"
