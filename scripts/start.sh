#!/bin/bash
set -e

cd "$(dirname "$0")/.."
source .env

PROJECT_DIR="$(pwd)"

check_port() {
    local PORT=$1
    local PID=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$PID" ]; then
        local CWD=$(ps -o cwd= -p "$PID" 2>/dev/null | xargs)
        local CMD=$(ps -o command= -p "$PID" 2>/dev/null)
        case "$CWD" in
            "$PROJECT_DIR"/*)
                echo "端口 $PORT 被当前项目占用，PID: $PID"
                kill "$PID"
                sleep 2
                ;;
            *)
                echo "端口 $PORT 被其他项目占用 (PID: $PID, CWD: $CWD)"
                return 1
                ;;
        esac
    fi
    return 0
}

find_available_slot() {
    local TAIL4=9088
    
    local SLOTS=(
        "40000 50000"
        "41000 51000"
        "42000 52000"
        "43000 53000"
        "44000 54000"
        "45000 55000"
    )
    
    for SLOT in "${SLOTS[@]}"; do
        read F B <<< "$SLOT"
        local FP=$((F + TAIL4))
        local BP=$((B + TAIL4))
        if ! lsof -nP -iTCP:$FP -sTCP:LISTEN -t >/dev/null 2>&1 && ! lsof -nP -iTCP:$BP -sTCP:LISTEN -t >/dev/null 2>&1; then
            export FRONTEND_PORT=$FP
            export BACKEND_PORT=$BP
            return 0
        fi
    done
    return 1
}

if ! check_port $FRONTEND_PORT || ! check_port $BACKEND_PORT; then
    echo "尝试查找备用端口..."
    if find_available_slot; then
        echo "使用备用端口: FRONTEND_PORT=$FRONTEND_PORT, BACKEND_PORT=$BACKEND_PORT"
        sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" .env
        sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" .env
        sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$FRONTEND_PORT|" .env
        sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$BACKEND_PORT|" .env
        sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$BACKEND_PORT/api|" .env
        sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$BACKEND_PORT/api|" .env
        source .env
    else
        echo "错误: 所有端口槽位均被占用，请手动释放端口"
        lsof -nP -iTCP:49088 -sTCP:LISTEN
        lsof -nP -iTCP:59088 -sTCP:LISTEN
        exit 1
    fi
fi

echo "=== 启动后端服务 (端口: $BACKEND_PORT) ==="
cd backend
nohup node src/app.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"
cd ..

sleep 5

echo "=== 启动前端服务 (端口: $FRONTEND_PORT) ==="
cd frontend
nohup npx vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"
cd ..

echo ""
echo "等待服务启动中..."
sleep 8

echo ""
echo "=== 服务状态检查 ==="
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$(grep '^FRONTEND_PORT=' .env | cut -d'=' -f2)
BACKEND_PORT=$(grep '^BACKEND_PORT=' .env | cut -d'=' -f2)

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "前端端口 $FRONTEND_PORT PID: $frontend_pid"
echo "后端端口 $BACKEND_PORT PID: $backend_pid"

if [ -n "$frontend_pid" ]; then
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
    FRONTEND_STAT=$(ps -o stat= -p "$frontend_pid")
    echo "前端进程状态: $FRONTEND_STAT"
fi

if [ -n "$backend_pid" ]; then
    ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
    BACKEND_STAT=$(ps -o stat= -p "$backend_pid")
    echo "后端进程状态: $BACKEND_STAT"
fi

echo ""
echo "=== HTTP 健康检查 ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/")
echo "前端首页 HTTP 状态: $HTTP_CODE"

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
echo "后端健康检查 HTTP 状态: $API_CODE"

echo ""
echo "=== 访问地址 ==="
echo "前端: http://127.0.0.1:$FRONTEND_PORT"
echo "后端 API: http://127.0.0.1:$BACKEND_PORT/api"
echo "健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "测试账号: 13800138000 / 123456"
echo ""
echo "日志文件: frontend.log, backend.log"
