#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

TAIL4=9099
SLOT_BASES=(40000 41000 42000 43000 44000 45000)
SLOT_INDEX=0

get_process_cwd() {
  local pid=$1
  local cwd=""
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1)
  if [ -z "$cwd" ] || [ "$cwd" = "/" ]; then
    cwd=$(pwdx "$pid" 2>/dev/null | awk '{print $2}' | head -n1)
  fi
  echo "$cwd"
}

is_project_process() {
  local pid=$1
  local cwd=$(get_process_cwd "$pid")
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  case "$cwd" in
    "$PROJECT_DIR"|"$PROJECT_DIR"/*) return 0 ;;
  esac
  
  case "$cmd" in
    *"$PROJECT_DIR"/*) return 0 ;;
  esac
  
  if [ -f "$PROJECT_DIR/.frontend.pid" ]; then
    local front_pid=$(cat "$PROJECT_DIR/.frontend.pid" 2>/dev/null)
    if [ "$front_pid" = "$pid" ]; then
      return 0
    fi
  fi
  
  if [ -f "$PROJECT_DIR/.backend.pid" ]; then
    local back_pid=$(cat "$PROJECT_DIR/.backend.pid" 2>/dev/null)
    if [ "$back_pid" = "$pid" ]; then
      return 0
    fi
  fi
  
  return 1
}

find_available_ports() {
  for i in "${!SLOT_BASES[@]}"; do
    F_PORT=$(( ${SLOT_BASES[$i]} + TAIL4 ))
    B_PORT=$(( ${SLOT_BASES[$i]} + 10000 + TAIL4 ))
    
    F_PID=$(lsof -nP -iTCP:$F_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    B_PID=$(lsof -nP -iTCP:$B_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    
    if [ -z "$F_PID" ] && [ -z "$B_PID" ]; then
      SLOT_INDEX=$i
      FRONTEND_PORT=$F_PORT
      BACKEND_PORT=$B_PORT
      return 0
    fi
    
    if [ -n "$F_PID" ]; then
      F_CWD=$(get_process_cwd "$F_PID")
      if is_project_process "$F_PID"; then
        echo "端口 $F_PORT 被当前项目占用，PID=$F_PID，尝试终止..."
        kill "$F_PID" 2>/dev/null || true
        sleep 1
      else
        echo "端口 $F_PORT 被其他项目占用 (cwd=$F_CWD)，跳过此槽位"
        continue
      fi
    fi
    
    if [ -n "$B_PID" ]; then
      B_CWD=$(get_process_cwd "$B_PID")
      if is_project_process "$B_PID"; then
        echo "端口 $B_PORT 被当前项目占用，PID=$B_PID，尝试终止..."
        kill "$B_PID" 2>/dev/null || true
        sleep 1
      else
        echo "端口 $B_PORT 被其他项目占用 (cwd=$B_CWD)，跳过此槽位"
        continue
      fi
    fi
    
    F_PID2=$(lsof -nP -iTCP:$F_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    B_PID2=$(lsof -nP -iTCP:$B_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    
    if [ -z "$F_PID2" ] && [ -z "$B_PID2" ]; then
      SLOT_INDEX=$i
      FRONTEND_PORT=$F_PORT
      BACKEND_PORT=$B_PORT
      return 0
    fi
  done
  
  echo "错误：所有端口槽位都被占用，请手动释放端口后重试"
  echo "占用的端口和进程："
  for i in "${!SLOT_BASES[@]}"; do
    F_PORT=$(( ${SLOT_BASES[$i]} + TAIL4 ))
    B_PORT=$(( ${SLOT_BASES[$i]} + 10000 + TAIL4 ))
    F_PID=$(lsof -nP -iTCP:$F_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    B_PID=$(lsof -nP -iTCP:$B_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    [ -n "$F_PID" ] && echo "  前端端口 $F_PORT: PID=$F_PID"
    [ -n "$B_PID" ] && echo "  后端端口 $B_PORT: PID=$B_PID"
  done
  exit 1
}

find_available_ports

FRONTEND_URL="http://127.0.0.1:$FRONTEND_PORT"
BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"
VITE_API_URL="$BACKEND_URL/api"
API_BASE_URL="$BACKEND_URL/api"
VITE_AUTO_DEMO_LOGIN=true

cat > .env <<EOF
PROJECT_DIR=$PROJECT_DIR
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
FRONTEND_URL=$FRONTEND_URL
BACKEND_URL=$BACKEND_URL
VITE_API_URL=$VITE_API_URL
API_BASE_URL=$API_BASE_URL
VITE_AUTO_DEMO_LOGIN=$VITE_AUTO_DEMO_LOGIN
EOF

cat > frontend/.env.local <<EOF
VITE_API_URL=$VITE_API_URL
VITE_AUTO_DEMO_LOGIN=$VITE_AUTO_DEMO_LOGIN
EOF

cat > backend/.env <<EOF
PORT=$BACKEND_PORT
HOST=127.0.0.1
CORS_ORIGIN=$FRONTEND_URL
EOF

echo "使用槽位 $SLOT_INDEX: 前端端口 $FRONTEND_PORT, 后端端口 $BACKEND_PORT"
echo "前端地址: $FRONTEND_URL"
echo "后端地址: $BACKEND_URL"

echo "正在启动后端服务..."
cd "$PROJECT_DIR/backend"
export PORT="$BACKEND_PORT"
export HOST="127.0.0.1"
export CORS_ORIGIN="$FRONTEND_URL"
nohup "$NODE_BIN" --watch "$PROJECT_DIR/backend/src/index.js" > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
echo "后端 PID: $BACKEND_PID"

echo "正在启动前端服务..."
cd "$PROJECT_DIR/frontend"
export FRONTEND_PORT="$FRONTEND_PORT"
export BACKEND_URL="$BACKEND_URL"
nohup npx vite --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"
echo "前端 PID: $FRONTEND_PID"

cd "$PROJECT_DIR"

echo "等待服务启动..."
sleep 8

echo "=== 服务状态检查 ==="
bash "$SCRIPT_DIR/check.sh"
