#!/bin/bash
PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-63403"
FRONTEND_PORT=43403
BACKEND_PORT=53403

start_backend() {
    echo "Starting backend..."
    cd "$PROJECT_DIR/backend"
    nohup node server.js > "$PROJECT_DIR/backend.log" 2>&1 &
    echo "Backend PID: $!"
}

start_frontend() {
    echo "Starting frontend..."
    cd "$PROJECT_DIR/frontend"
    nohup node node_modules/vite/bin/vite.js --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
    echo "Frontend PID: $!"
}

check_status() {
    sleep 5
    echo "=== Checking services ==="
    
    backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    
    if [ -n "$backend_pid" ]; then
        echo "Backend: Running (PID: $backend_pid)"
    else
        echo "Backend: Not running"
    fi
    
    if [ -n "$frontend_pid" ]; then
        echo "Frontend: Running (PID: $frontend_pid)"
    else
        echo "Frontend: Not running"
    fi
}

case "${1:-start}" in
    start)
        start_backend
        start_frontend
        check_status
        echo ""
        echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
        echo "Backend:  http://127.0.0.1:$BACKEND_PORT/api/health"
        ;;
    stop)
        FRONTEND_PORT=$FRONTEND_PORT
        pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null
            echo "Frontend stopped (PID: $pid)"
        fi
        BACKEND_PORT=$BACKEND_PORT
        pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null
            echo "Backend stopped (PID: $pid)"
        fi
        ;;
    status)
        check_status
        ;;
esac