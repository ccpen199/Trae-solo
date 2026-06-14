#!/usr/bin/env bash
set -uo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89034"
FRONTEND_PORT="${FRONTEND_PORT:-50034}"
BACKEND_PORT="${BACKEND_PORT:-59034}"
NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"

cd "$PROJECT_DIR"

is_project_pid() {
  local pid="$1"
  local cwd
  cwd="$(lsof -p "$pid" 2>/dev/null | awk '$4=="cwd"{print $9; exit}')"
  [[ "$cwd" == "$PROJECT_DIR"* ]]
}

stop_project_listener() {
  local port="$1"
  local pid
  while read -r pid; do
    [[ -n "$pid" ]] || continue
    if is_project_pid "$pid"; then
      kill "$pid" 2>/dev/null || true
    fi
  done < <(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print $2}' | sort -u)
}

stop_project_listener "$FRONTEND_PORT"
stop_project_listener "$BACKEND_PORT"
sleep 1

: > frontend.log
: > backend.log

run_backend() {
  cd "$PROJECT_DIR/backend"
  while true; do
    "$NODE_BIN" src/server.js
    code=$?
    echo "backend exited with ${code} at $(date)" >> "$PROJECT_DIR/backend.log"
    sleep 2
  done
}

run_frontend() {
  cd "$PROJECT_DIR/frontend"
  while true; do
    tail -f /dev/null | ./node_modules/.bin/vite --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
    code=$?
    echo "frontend exited with ${code} at $(date)" >> "$PROJECT_DIR/frontend.log"
    sleep 2
  done
}

run_backend >> "$PROJECT_DIR/backend.log" 2>&1 &
backend_loop_pid=$!
echo "$backend_loop_pid" > backend.pid

run_frontend >> "$PROJECT_DIR/frontend.log" 2>&1 &
frontend_loop_pid=$!
echo "$frontend_loop_pid" > frontend.pid

cleanup() {
  kill "$backend_loop_pid" "$frontend_loop_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "may-89034 runtime started: frontend=http://127.0.0.1:${FRONTEND_PORT}/ backend=http://127.0.0.1:${BACKEND_PORT}"
wait "$backend_loop_pid" "$frontend_loop_pid"
