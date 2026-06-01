#!/bin/bash

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-86792"
FRONTEND_PORT=47792
BACKEND_PORT=56792

cd "$PROJECT_DIR"

start_backend() {
    echo "启动后端服务..."
    cd "$PROJECT_DIR/backend"
    npm start > ../backend.log 2>&1 &
    echo "后端 PID: $!"
}

start_frontend() {
    echo "启动前端服务..."
    cd "$PROJECT_DIR/frontend"
    python3 -m http.server $FRONTEND_PORT --directory dist > ../frontend.log 2>&1 &
    echo "前端 PID: $!"
}

stop_all() {
    echo "停止所有服务..."
    frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

    if [ -n "$frontend_pid" ]; then
        cwd=$(lsof -p $frontend_pid 2>/dev/null | grep cwd | awk '{print $NF}')
        if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
            echo "停止前端 (PID: $frontend_pid)..."
            kill $frontend_pid
        fi
    fi

    if [ -n "$backend_pid" ]; then
        cwd=$(lsof -p $backend_pid 2>/dev/null | grep cwd | awk '{print $NF}')
        if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
            echo "停止后端 (PID: $backend_pid)..."
            kill $backend_pid
        fi
    fi
}

status() {
    echo "=== 服务状态 ==="
    echo ""
    echo "前端 (端口 $FRONTEND_PORT):"
    frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$frontend_pid" ]; then
        ps -p $frontend_pid -o pid=,stat=,command= 2>/dev/null | head -1
        echo "✓ 前端运行中"
    else
        echo "✗ 前端未运行"
    fi
    echo ""
    echo "后端 (端口 $BACKEND_PORT):"
    backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$backend_pid" ]; then
        ps -p $backend_pid -o pid=,stat=,command= 2>/dev/null | head -1
        echo "✓ 后端运行中"
    else
        echo "✗ 后端未运行"
    fi
    echo ""
    echo "访问地址:"
    echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
    echo "  后端: http://127.0.0.1:$BACKEND_PORT"
    echo "  API:  http://127.0.0.1:$BACKEND_PORT/api/health"
}

case "$1" in
    start)
        start_backend
        sleep 3
        start_frontend
        sleep 2
        status
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        start_backend
        sleep 3
        start_frontend
        sleep 2
        status
        ;;
    status)
        status
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
