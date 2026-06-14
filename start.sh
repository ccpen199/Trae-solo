#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

NODE22_BIN="$HOME/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

# Load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Port calculation constants
TAIL4=9083
SLOTS=(0 1000 2000 3000 4000 5000)

# Function to find next available port slot
find_available_ports() {
  for slot in "${SLOTS[@]}"; do
    test_frontend=$((40000 + slot + TAIL4))
    test_backend=$((50000 + slot + TAIL4))
    frontend_occ=$(lsof -nP -iTCP:$test_frontend -sTCP:LISTEN -t 2>/dev/null | head -n1)
    backend_occ=$(lsof -nP -iTCP:$test_backend -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -z "$frontend_occ" ] && [ -z "$backend_occ" ]; then
      echo "$test_frontend $test_backend $slot"
      return
    fi
  done
  echo "0 0 -1"
}

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

# Check current ports
echo "=== Checking ports ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

# If ports are occupied, check if they belong to this project
if [ -n "$frontend_pid" ] || [ -n "$backend_pid" ]; then
  need_switch=0
  if [ -n "$frontend_pid" ]; then
    cwd=$(pid_cwd "$frontend_pid")
    case "$cwd" in
      "$PROJECT_DIR"*)
        echo "Frontend port $FRONTEND_PORT is used by our project (PID $frontend_pid), stopping it first"
        kill "$frontend_pid" 2>/dev/null || true
        sleep 1
        ;;
      *)
        echo "Frontend port $FRONTEND_PORT is occupied by another project (cwd=$cwd), need to switch slots"
        need_switch=1
        ;;
    esac
  fi
  if [ -n "$backend_pid" ]; then
    cwd=$(pid_cwd "$backend_pid")
    case "$cwd" in
      "$PROJECT_DIR"*)
        echo "Backend port $BACKEND_PORT is used by our project (PID $backend_pid), stopping it first"
        kill "$backend_pid" 2>/dev/null || true
        sleep 1
        ;;
      *)
        echo "Backend port $BACKEND_PORT is occupied by another project (cwd=$cwd), need to switch slots"
        need_switch=1
        ;;
    esac
  fi

  if [ "$need_switch" -eq 1 ]; then
    read new_frontend new_backend slot_idx < <(find_available_ports)
    if [ "$slot_idx" -eq "-1" ]; then
      echo "ERROR: All port slots are occupied!"
      for slot in "${SLOTS[@]}"; do
        f=$((40000 + slot + TAIL4))
        b=$((50000 + slot + TAIL4))
        fpid=$(lsof -nP -iTCP:$f -sTCP:LISTEN -t 2>/dev/null | head -n1)
        bpid=$(lsof -nP -iTCP:$b -sTCP:LISTEN -t 2>/dev/null | head -n1)
        [ -n "$fpid" ] && echo "  Port $f: PID $fpid - cwd=$(pid_cwd "$fpid") cmd=$(ps -o command= -p "$fpid" 2>/dev/null)"
        [ -n "$bpid" ] && echo "  Port $b: PID $bpid - cwd=$(pid_cwd "$bpid") cmd=$(ps -o command= -p "$bpid" 2>/dev/null)"
      done
      exit 1
    fi
    echo "Switching to slot $slot_idx: FRONTEND=$new_frontend, BACKEND=$new_backend"
    # Update .env
    sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$new_frontend/" .env && rm -f .env.bak
    sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$new_backend/" .env && rm -f .env.bak
    sed -i.bak "s/^APP_PORT=.*/APP_PORT=$new_frontend/" .env && rm -f .env.bak
    sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$new_frontend|" .env && rm -f .env.bak
    sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$new_backend|" .env && rm -f .env.bak
    sed -i.bak "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$new_backend/api|" .env && rm -f .env.bak
    sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$new_backend/api|" .env && rm -f .env.bak
    sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$new_frontend|" .env && rm -f .env.bak
    # Reload
    export $(cat .env | grep -v '^#' | xargs)
  fi
fi

echo "=== Starting services ==="
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"

# Start backend in background
if [ -f backend/package.json ]; then
  echo "Starting backend..."
  cd "$PROJECT_DIR"
  node "$PROJECT_DIR/start_detached.js" backend
  BACKEND_START_PID=$(cat "$PROJECT_DIR/backend.pid")
  cd "$PROJECT_DIR"
  echo "Backend start PID: $BACKEND_START_PID"
fi

# Start frontend in background
if [ -f frontend/package.json ]; then
  echo "Starting frontend..."
  cd "$PROJECT_DIR"
  node "$PROJECT_DIR/start_detached.js" frontend
  FRONTEND_START_PID=$(cat "$PROJECT_DIR/frontend.pid")
  cd "$PROJECT_DIR"
  echo "Frontend start PID: $FRONTEND_START_PID"
fi

# Wait for services to start
echo "Waiting 10 seconds for services to initialize..."
sleep 10

# Verify
echo ""
echo "=== Verification ==="
"$PROJECT_DIR/verify.sh"
