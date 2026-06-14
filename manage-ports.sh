#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

function load_env() {
  if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r key value; do
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      export "$key=$value"
    done < "$ENV_FILE"
  fi
}

function get_port_slot() {
  local slot=$1
  local type=$2
  local frontend_var="SLOT${slot}_FRONTEND"
  local backend_var="SLOT${slot}_BACKEND"
  if [ "$type" = "frontend" ]; then
    echo "${!frontend_var}"
  else
    echo "${!backend_var}"
  fi
}

function get_process_cwd() {
  local pid=$1
  lsof -p "$pid" 2>/dev/null | grep ' cwd ' | awk '{print $9}' | head -1
}

function is_project_process() {
  local pid=$1
  local cwd=$(get_process_cwd "$pid")
  if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
    return 0
  fi
  return 1
}

function safe_kill() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    return 0
  fi
  local cwd=$(get_process_cwd "$pid")
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "Killing project process PID=$pid on port=$port (cwd=$cwd)"
      kill "$pid"
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      ;;
    *)
      echo "SKIP kill: port=$port PID=$pid cwd=$cwd cmd=$cmd (not in project dir)"
      return 1
      ;;
  esac
}

function check_port_available() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    return 0
  fi
  if is_project_process "$pid"; then
    return 2
  fi
  return 1
}

function update_env_port() {
  local key=$1
  local value=$2
  if grep -q "^$key=" "$ENV_FILE"; then
    sed -i '' "s|^$key=.*|$key=$value|" "$ENV_FILE"
  else
    echo "$key=$value" >> "$ENV_FILE"
  fi
}

function find_available_slot() {
  for slot in 0 1 2 3 4 5; do
    local frontend_port=$(get_port_slot $slot frontend)
    local backend_port=$(get_port_slot $slot backend)
    local frontend_status=0
    local backend_status=0
    check_port_available "$frontend_port" || frontend_status=$?
    check_port_available "$backend_port" || backend_status=$?
    if [ $frontend_status -eq 0 ] && [ $backend_status -eq 0 ]; then
      echo "$slot $frontend_port $backend_port"
      return 0
    elif [ $frontend_status -eq 2 ] && [ $backend_status -eq 2 ]; then
      echo "$slot $frontend_port $backend_port owned"
      return 0
    fi
  done
  echo "none"
  return 1
}

function switch_port_slot() {
  load_env
  local result=$(find_available_slot)
  if [ "$result" = "none" ]; then
    echo "ERROR: All port slots occupied! Please free some ports."
    echo "Check occupied ports with: lsof -nP -iTCP:49086,50086,51086,52086,53086,54086 -sTCP:LISTEN"
    exit 1
  fi
  local parts=($result)
  local slot=${parts[0]}
  local frontend_port=${parts[1]}
  local backend_port=${parts[2]}
  echo "Switching to slot $slot: frontend=$frontend_port, backend=$backend_port"
  update_env_port "PORT_SLOT" "$slot"
  update_env_port "FRONTEND_PORT" "$frontend_port"
  update_env_port "BACKEND_PORT" "$backend_port"
  update_env_port "APP_PORT" "$frontend_port"
  update_env_port "FRONTEND_URL" "http://127.0.0.1:$frontend_port"
  update_env_port "BACKEND_URL" "http://127.0.0.1:$backend_port"
  update_env_port "API_BASE_URL" "http://127.0.0.1:$backend_port/api"
  update_env_port "VITE_API_URL" "http://127.0.0.1:$backend_port/api"
  update_env_port "CORS_ORIGIN" "http://127.0.0.1:$frontend_port"
  echo "Updated .env with slot $slot ports"
}

function check_ports() {
  load_env
  echo "=== Port Status Check ==="
  echo "Project: $PROJECT_NAME"
  echo "Current slot: $PORT_SLOT"
  echo ""
  for port in $FRONTEND_PORT $BACKEND_PORT; do
    local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$pid" ]; then
      local cwd=$(get_process_cwd "$pid")
      local stat=$(ps -o stat= -p "$pid" 2>/dev/null || true)
      local owned="NO"
      if is_project_process "$pid"; then
        owned="YES"
      fi
      printf "Port %-5s | PID=%-6s | Stat=%-4s | Owned=%-3s | CWD=%s\n" "$port" "$pid" "$stat" "$owned" "$cwd"
    else
      printf "Port %-5s | FREE\n" "$port"
    fi
  done
}

case "${1:-check}" in
  check)
    check_ports
    ;;
  switch)
    switch_port_slot
    ;;
  kill-frontend)
    load_env
    safe_kill "$FRONTEND_PORT"
    ;;
  kill-backend)
    load_env
    safe_kill "$BACKEND_PORT"
    ;;
  kill-all)
    load_env
    safe_kill "$FRONTEND_PORT" || true
    safe_kill "$BACKEND_PORT" || true
    ;;
  *)
    echo "Usage: $0 {check|switch|kill-frontend|kill-backend|kill-all}"
    exit 1
    ;;
esac
