#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

get_tail4() {
  local dirname=$(basename "$PROJECT_DIR")
  local num=$(echo "$dirname" | grep -oE '[0-9]+' | head -1)
  printf "%04d" "${num: -4}"
}

TAIL4=$(get_tail4)

get_port_for_slot() {
  local slot=$1
  local type=$2
  if [ "$type" = "frontend" ]; then
    echo $((40000 + slot * 1000 + TAIL4))
  else
    echo $((50000 + slot * 1000 + TAIL4))
  fi
}

get_process_cwd() {
  local pid=$1
  local cwd=""
  
  if cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//'); then
    cwd=$(echo "$cwd" | xargs)
  fi
  
  if [ -z "$cwd" ]; then
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
    if echo "$cmd" | grep -q "$PROJECT_DIR"; then
      cwd="$PROJECT_DIR"
    fi
  fi
  
  echo "$cwd"
}

check_port_owner() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    echo "FREE"
    return
  fi
  
  local cwd=$(get_process_cwd "$pid")
  if [ -z "$cwd" ]; then
    echo "UNKNOWN"
    return
  fi
  
  case "$cwd" in
    "$PROJECT_DIR"/*) echo "OWNED:$pid" ;;
    *) echo "OTHER:$pid:$cwd" ;;
  esac
}

find_available_port() {
  local type=$1
  for slot in 0 1 2 3 4 5; do
    local port=$(get_port_for_slot $slot $type)
    local status=$(check_port_owner $port)
    
    if [ "$status" = "FREE" ]; then
      echo "$port:$slot"
      return
    elif [[ "$status" == OWNED:* ]]; then
      local pid=${status#OWNED:}
      echo "KILLING:$port:$slot:$pid"
      return
    fi
  done
  echo "NONE"
}

update_env_port() {
  local key=$1
  local value=$2
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

kill_owned_pid() {
  local pid=$1
  local cwd=$(get_process_cwd "$pid")
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
  
  case "$cwd" in
    "$PROJECT_DIR"/*) 
      kill "$pid" 2>/dev/null || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null 2>&1; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      echo "Killed PID $pid (cwd: $cwd)"
      ;;
    *) 
      echo "SKIP: PID $pid not owned by this project (cwd: $cwd, cmd: $cmd)"
      ;;
  esac
}

case "$1" in
  init)
    FRONTEND_RESULT=$(find_available_port frontend)
    BACKEND_RESULT=$(find_available_port backend)
    
    if [[ "$FRONTEND_RESULT" == KILLING:* ]]; then
      IFS=':' read -r _ FPORT FSLOT FPID <<< "$FRONTEND_RESULT"
      kill_owned_pid "$FPID"
      update_env_port "FRONTEND_PORT" "$FPORT"
    elif [[ "$FRONTEND_RESULT" == NONE ]]; then
      echo "ERROR: No available frontend ports in any slot!"
      exit 1
    else
      IFS=':' read -r FPORT FSLOT <<< "$FRONTEND_RESULT"
      update_env_port "FRONTEND_PORT" "$FPORT"
    fi
    
    if [[ "$BACKEND_RESULT" == KILLING:* ]]; then
      IFS=':' read -r _ BPORT BSLOT BPID <<< "$BACKEND_RESULT"
      kill_owned_pid "$BPID"
      update_env_port "BACKEND_PORT" "$BPORT"
    elif [[ "$BACKEND_RESULT" == NONE ]]; then
      echo "ERROR: No available backend ports in any slot!"
      exit 1
    else
      IFS=':' read -r BPORT BSLOT <<< "$BACKEND_RESULT"
      update_env_port "BACKEND_PORT" "$BPORT"
    fi
    
    source "$ENV_FILE"
    update_env_port "VITE_API_BASE_URL" "http://127.0.0.1:${BACKEND_PORT}/api"
    update_env_port "API_BASE_URL" "http://127.0.0.1:${BACKEND_PORT}/api"
    
    echo "Ports configured:"
    echo "  FRONTEND_PORT=$FRONTEND_PORT (slot $FSLOT)"
    echo "  BACKEND_PORT=$BACKEND_PORT (slot $BSLOT)"
    ;;
  
  check)
    source "$ENV_FILE"
    echo "Checking ports..."
    echo "  FRONTEND_PORT=$FRONTEND_PORT: $(check_port_owner $FRONTEND_PORT)"
    echo "  BACKEND_PORT=$BACKEND_PORT: $(check_port_owner $BACKEND_PORT)"
    ;;
  
  kill-owned)
    source "$ENV_FILE"
    for port in $FRONTEND_PORT $BACKEND_PORT; do
      status=$(check_port_owner $port)
      if [[ "$status" == OWNED:* ]]; then
        pid=${status#OWNED:}
        kill_owned_pid "$pid"
      fi
    done
    ;;
  
  *)
    echo "Usage: $0 {init|check|kill-owned}"
    exit 1
    ;;
esac
