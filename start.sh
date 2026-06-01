#!/bin/bash
set -e

cd "$(dirname "$0")"
source .env

PROJECT_DIR="$(pwd)"
NODE22_BIN="$HOME/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi
SESSION_PREFIX="$(basename "$PROJECT_DIR")"
FRONTEND_SESSION="$SESSION_PREFIX-frontend"
BACKEND_SESSION="$SESSION_PREFIX-backend"

echo "========================================"
echo "Crop Insurance System - Startup Script"
echo "========================================"
echo "Project: $PROJECT_DIR"
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port: $BACKEND_PORT"
echo ""

check_port() {
  local PORT=$1
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    case "$cwd" in
      "$PROJECT_DIR"|"$PROJECT_DIR"/*)
        echo "Port $PORT is used by current project (PID: $pid), killing..."
        kill "$pid" 2>/dev/null || true
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
          echo "Port $PORT process is still alive, force killing PID $pid..."
          kill -9 "$pid" 2>/dev/null || true
          sleep 1
        fi
        ;;
      *)
        echo "WARNING: Port $PORT is occupied by another process!"
        echo "  PID: $pid"
        echo "  CWD: $cwd"
        echo "  CMD: $cmd"
        echo "Trying alternate port slot..."
        
        for SLOT in 1 2 3 4 5; do
          local NEW_FRONTEND=$((40000 + $SLOT * 1000 + $TAIL4))
          local NEW_BACKEND=$((50000 + $SLOT * 1000 + $TAIL4))
          echo "  Slot $SLOT: Frontend $NEW_FRONTEND, Backend $NEW_BACKEND"
          
          local fpid=$(lsof -nP -iTCP:$NEW_FRONTEND -sTCP:LISTEN -t | head -n1)
          local bpid=$(lsof -nP -iTCP:$NEW_BACKEND -sTCP:LISTEN -t | head -n1)
          
          if [ -z "$fpid" ] && [ -z "$bpid" ]; then
            echo "  Found available ports! Updating .env..."
            FRONTEND_PORT=$NEW_FRONTEND
            BACKEND_PORT=$NEW_BACKEND
            VITE_API_BASE_URL="http://127.0.0.1:$NEW_BACKEND/api"
            API_BASE_URL="http://127.0.0.1:$NEW_BACKEND/api"
            
            cat > .env <<EOF
PROJECT_DIR=$PROJECT_DIR
TAIL4=$TAIL4
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
VITE_API_BASE_URL=$VITE_API_BASE_URL
API_BASE_URL=$API_BASE_URL
DB_PATH=./data/crop_insurance.db
UPLOAD_DIR=./uploads
NODE_ENV=development
EOF
            echo "  Updated .env with new ports"
            break
          fi
        done
        
        if [ "$SLOT" -eq 5 ]; then
          echo "ERROR: All port slots are occupied!"
          echo "Please free up ports or manually configure available ports in .env"
          exit 1
        fi
        ;;
    esac
  fi
}

echo "Checking ports..."
check_port $FRONTEND_PORT
check_port $BACKEND_PORT

if command -v tmux >/dev/null 2>&1; then
  tmux kill-session -t "$FRONTEND_SESSION" 2>/dev/null || true
  tmux kill-session -t "$BACKEND_SESSION" 2>/dev/null || true
fi

echo ""
echo "Starting backend server..."
if command -v tmux >/dev/null 2>&1; then
  tmux new-session -d -s "$BACKEND_SESSION" -c "$PROJECT_DIR/backend" "export PATH=\"$PATH\"; exec node index.js > ../backend.log 2>&1"
  BACKEND_PID=$(tmux display-message -p -t "$BACKEND_SESSION" '#{pane_pid}' 2>/dev/null || true)
  echo "Backend tmux session: $BACKEND_SESSION"
  echo "Backend launcher PID: $BACKEND_PID"
else
  cd backend
  nohup node index.js > ../backend.log 2>&1 &
  BACKEND_PID=$!
  echo "$BACKEND_PID" > ../backend.pid
  echo "Backend PID: $BACKEND_PID"
  cd ..
fi

echo "Starting frontend server..."
if command -v tmux >/dev/null 2>&1; then
  tmux new-session -d -s "$FRONTEND_SESSION" -c "$PROJECT_DIR/frontend" "export PATH=\"$PATH\"; exec npm run dev > ../frontend.log 2>&1"
  FRONTEND_PID=$(tmux display-message -p -t "$FRONTEND_SESSION" '#{pane_pid}' 2>/dev/null || true)
  echo "Frontend tmux session: $FRONTEND_SESSION"
  echo "Frontend launcher PID: $FRONTEND_PID"
else
  cd frontend
  nohup npm run dev > ../frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" > ../frontend.pid
  echo "Frontend PID: $FRONTEND_PID"
  cd ..
fi

echo ""
echo "Waiting for services to start (5 seconds)..."
sleep 5

echo ""
echo "========================================"
echo "Service Status Check"
echo "========================================"

PROJECT_DIR="$(pwd)"
echo "Project Directory: $PROJECT_DIR"
echo ""

echo "--- Frontend (Port $FRONTEND_PORT) ---"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$frontend_pid" ]; then
  echo "$frontend_pid" > frontend.pid
  echo "Listening PID: $frontend_pid"
  frontend_cwd=$(lsof -a -d cwd -p "$frontend_pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  echo "CWD: $frontend_cwd"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "Process not found"
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  echo "Process Status: $frontend_stat"
  
  if [[ "$frontend_stat" == *T* ]] || [[ "$frontend_stat" == *Z* ]]; then
    echo "ERROR: Frontend process is not running properly (status: $frontend_stat)"
    exit 1
  fi
  
  echo ""
  echo "HTTP Check:"
  curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -5
else
  echo "ERROR: Frontend port $FRONTEND_PORT is not listening!"
  echo "Frontend log tail:"
  tail -20 frontend.log
  exit 1
fi

echo ""
echo "--- Backend (Port $BACKEND_PORT) ---"
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  echo "$backend_pid" > backend.pid
  echo "Listening PID: $backend_pid"
  backend_cwd=$(lsof -a -d cwd -p "$backend_pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  echo "CWD: $backend_cwd"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "Process not found"
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  echo "Process Status: $backend_stat"
  
  if [[ "$backend_stat" == *T* ]] || [[ "$backend_stat" == *Z* ]]; then
    echo "ERROR: Backend process is not running properly (status: $backend_stat)"
    exit 1
  fi
  
  echo ""
  echo "API Health Check:"
  curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1
  echo ""
else
  echo "ERROR: Backend port $BACKEND_PORT is not listening!"
  echo "Backend log tail:"
  tail -20 backend.log
  exit 1
fi

echo ""
echo "========================================"
echo "Startup Complete!"
echo "========================================"
echo "Frontend URL: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend API:  http://127.0.0.1:$BACKEND_PORT/api"
echo ""
echo "Test Accounts:"
echo "  监管方: admin / 系统管理员"
echo "  保险公司: insurer1 / 张保险"
echo "  查勘员: surveyor1 / 李查勘"
echo "  乡镇: township1 / 王乡镇"
echo "  农户: farmer1 / 赵农户"
echo ""
echo "To stop services, run: ./stop.sh"
echo "========================================"
