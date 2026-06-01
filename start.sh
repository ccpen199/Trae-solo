#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$PROJECT_DIR/.pids"
LOG_DIR="$PROJECT_DIR/.logs"

mkdir -p "$PID_DIR" "$LOG_DIR"

stop_service() {
    local port=$1
    local name=$2
    echo "Stopping $name..."
    pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        kill -9 $pids 2>/dev/null || true
    fi
    rm -f "$PID_DIR/$name.pid" 2>/dev/null || true
}

start_backend() {
    echo "Starting backend service..."
    stop_service 44852 backend
    cd "$PROJECT_DIR/backend"
    nohup node src/index.js > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"
    sleep 2
    if curl -s http://localhost:44852/api/health > /dev/null 2>&1; then
        echo "✅ Backend started successfully (PID: $(cat $PID_DIR/backend.pid))"
    else
        echo "❌ Backend failed to start"
        cat "$LOG_DIR/backend.log" 2>/dev/null || true
    fi
}

start_frontend() {
    echo "Starting frontend service..."
    stop_service 45852 frontend
    cd "$PROJECT_DIR/frontend"
    nohup npx vite --port 45852 --host 0.0.0.0 > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
    sleep 3
    if curl -s http://localhost:45852 > /dev/null 2>&1; then
        echo "✅ Frontend started successfully (PID: $(cat $PID_DIR/frontend.pid))"
    else
        echo "❌ Frontend failed to start"
        cat "$LOG_DIR/frontend.log" 2>/dev/null || true
    fi
}

status() {
    echo "=== Service Status ==="
    for port in 44852 45852; do
        name="backend"
        [ $port -eq 45852 ] && name="frontend"
        if lsof -ti :$port > /dev/null 2>&1; then
            echo "✅ $name (port $port) is running"
        else
            echo "❌ $name (port $port) is NOT running"
        fi
    done
}

case "${1:-start}" in
    start)
        start_backend
        start_frontend
        status
        echo ""
        echo "🌐 Access URLs:"
        echo "   Frontend: http://localhost:45852"
        echo "   Backend API: http://localhost:44852/api"
        ;;
    stop)
        stop_service 44852 backend
        stop_service 45852 frontend
        status
        ;;
    restart)
        $0 stop
        sleep 1
        $0 start
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
