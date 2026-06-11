#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"
FRONTEND_SESSION="pinai_${PROJECT_NAME}_frontend"
BACKEND_SESSION="pinai_${PROJECT_NAME}_backend"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found"
    exit 1
fi

set -a
source "$ENV_FILE"
set +a

check_port_available() {
    local port=$1
    local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$pid" ]; then
        local cwd=$(get_process_cwd "$pid")
        local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
        case "$cwd" in
            "$PROJECT_DIR"/*)
                echo "Port $port is used by current project (pid=$pid), killing..."
                kill "$pid" 2>/dev/null || true
                sleep 1
                ;;
            *)
                echo "Port $port is occupied by another project (pid=$pid, cwd=$cwd)"
                echo "Will try next available slot..."
                return 1
                ;;
        esac
    fi
    return 0
}

find_available_ports() {
    local tail4=9103
    local slots=(0 10000 20000 30000 40000 50000)
    
    for slot in "${slots[@]}"; do
        local frontend_port=$((40000 + slot + tail4))
        local backend_port=$((50000 + slot + tail4))
        
        echo "Checking slot $slot: frontend=$frontend_port, backend=$backend_port"
        
        local fe_pid=$(lsof -nP -iTCP:$frontend_port -sTCP:LISTEN -t 2>/dev/null | head -n1)
        local be_pid=$(lsof -nP -iTCP:$backend_port -sTCP:LISTEN -t 2>/dev/null | head -n1)
        
        local fe_available=true
        local be_available=true
        
        if [ -n "$fe_pid" ]; then
            local fe_cwd=$(get_process_cwd "$fe_pid")
            case "$fe_cwd" in
                "$PROJECT_DIR"/*)
                    echo "Killing existing frontend pid=$fe_pid"
                    kill "$fe_pid" 2>/dev/null || true
                    sleep 1
                    ;;
                *)
                    fe_available=false
                    ;;
            esac
        fi
        
        if [ -n "$be_pid" ]; then
            local be_cwd=$(get_process_cwd "$be_pid")
            case "$be_cwd" in
                "$PROJECT_DIR"/*)
                    echo "Killing existing backend pid=$be_pid"
                    kill "$be_pid" 2>/dev/null || true
                    sleep 1
                    ;;
                *)
                    be_available=false
                    ;;
            esac
        fi
        
        if [ "$fe_available" = true ] && [ "$be_available" = true ]; then
            FRONTEND_PORT=$frontend_port
            BACKEND_PORT=$backend_port
            return 0
        fi
    done
    
    echo "ERROR: All port slots are occupied by other projects!"
    echo "Please free up ports or manually configure in .env"
    exit 1
}

get_process_cwd() {
    local pid=$1
    local cwd=""
    cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
    if [ -z "$cwd" ]; then
        local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
        if echo "$cmd" | grep -Fq "$PROJECT_DIR"; then
            cwd="$PROJECT_DIR"
        fi
    fi
    echo "$cwd"
}

update_env_ports() {
    sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" "$ENV_FILE"
    sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" "$ENV_FILE"
    sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$FRONTEND_PORT|" "$ENV_FILE"
    sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$BACKEND_PORT|" "$ENV_FILE"
    sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$BACKEND_PORT/api|" "$ENV_FILE"
    sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$BACKEND_PORT/api|" "$ENV_FILE"
    source "$ENV_FILE"
    echo "Updated .env with FRONTEND_PORT=$FRONTEND_PORT, BACKEND_PORT=$BACKEND_PORT"
}

start_detached() {
    local session=$1
    local cwd=$2
    local command=$3

    if [ -x "$TMUX_BIN" ]; then
        "$TMUX_BIN" has-session -t "$session" >/dev/null 2>&1 && "$TMUX_BIN" kill-session -t "$session" || true
        "$TMUX_BIN" new-session -d -s "$session" -c "$cwd" /bin/zsh -lc "$command"
    else
        (
            cd "$cwd"
            nohup /bin/zsh -lc "$command" >/dev/null 2>&1 &
            disown
        )
    fi
}

if ! check_port_available "$FRONTEND_PORT" || ! check_port_available "$BACKEND_PORT"; then
    find_available_ports
    update_env_ports
fi

mkdir -p "$PROJECT_DIR/data"
mkdir -p "$PROJECT_DIR/logs"

echo "========================================"
echo "Starting project may-89103"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo "========================================"

if [ -d "$PROJECT_DIR/frontend" ] && [ -f "$PROJECT_DIR/frontend/package.json" ]; then
    echo "Starting frontend..."
    start_detached "$FRONTEND_SESSION" "$PROJECT_DIR/frontend" "PROJECT_DIR='$PROJECT_DIR' HOST='127.0.0.1' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' npm run build > '$PROJECT_DIR/logs/frontend.log' 2>&1 && exec node static-server.js >> '$PROJECT_DIR/logs/frontend.log' 2>&1"
    echo "Frontend session: $FRONTEND_SESSION"
fi

if [ -d "$PROJECT_DIR/backend" ]; then
    echo "Starting backend..."
    
    if [ -f "$PROJECT_DIR/backend/server.js" ]; then
        start_detached "$BACKEND_SESSION" "$PROJECT_DIR/backend" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='127.0.0.1' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' exec node server.js > '$PROJECT_DIR/logs/backend.log' 2>&1"
    elif [ -f "$PROJECT_DIR/backend/package.json" ]; then
        start_detached "$BACKEND_SESSION" "$PROJECT_DIR/backend" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='127.0.0.1' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' npm run build > '$PROJECT_DIR/logs/backend.log' 2>&1 && exec npm run start >> '$PROJECT_DIR/logs/backend.log' 2>&1"
    elif [ -f "$PROJECT_DIR/backend/main.py" ] || [ -f "$PROJECT_DIR/backend/app.py" ]; then
        start_detached "$BACKEND_SESSION" "$PROJECT_DIR/backend" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='127.0.0.1' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' exec python3 app.py > '$PROJECT_DIR/logs/backend.log' 2>&1"
    fi
    
    echo "Backend session: $BACKEND_SESSION"
fi

echo "Waiting 5 seconds for services to start..."
sleep 5

echo ""
echo "========================================"
echo "Service Status Check:"
echo "========================================"

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

if [ -n "$frontend_pid" ]; then
    echo "$frontend_pid" > "$PROJECT_DIR/.frontend.pid"
    echo "Frontend PID: $frontend_pid"
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
    echo "cwd: $(get_process_cwd "$frontend_pid")"
    echo "Frontend HTTP check:"
    curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -n5
else
    echo "WARNING: Frontend is not listening on port $FRONTEND_PORT"
fi

echo ""

if [ -n "$backend_pid" ]; then
    echo "$backend_pid" > "$PROJECT_DIR/.backend.pid"
    echo "Backend PID: $backend_pid"
    ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
    echo "cwd: $(get_process_cwd "$backend_pid")"
    echo "Backend health check:"
    curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 || echo "Health endpoint not available yet"
else
    echo "WARNING: Backend is not listening on port $BACKEND_PORT"
fi

echo ""
echo "========================================"
echo "Startup complete!"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo "Logs:"
echo "  Frontend: $PROJECT_DIR/logs/frontend.log"
echo "  Backend:  $PROJECT_DIR/logs/backend.log"
echo "========================================"
