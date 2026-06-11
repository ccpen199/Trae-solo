#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49099}
BACKEND_PORT=${BACKEND_PORT:-59099}

get_process_cwd() {
  local pid=$1
  local cwd=""
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1)
  if [ -z "$cwd" ] || [ "$cwd" = "/" ]; then
    cwd=$(pwdx "$pid" 2>/dev/null | awk '{print $2}' | head -n1)
  fi
  echo "$cwd"
}

is_project_process() {
  local pid=$1
  local cwd=$(get_process_cwd "$pid")
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  case "$cwd" in
    "$PROJECT_DIR"|"$PROJECT_DIR"/*) return 0 ;;
  esac
  
  case "$cmd" in
    *"$PROJECT_DIR"/*) return 0 ;;
  esac
  
  if [ -f "$PROJECT_DIR/.frontend.pid" ]; then
    local front_pid=$(cat "$PROJECT_DIR/.frontend.pid" 2>/dev/null)
    if [ "$front_pid" = "$pid" ]; then
      return 0
    fi
  fi
  
  if [ -f "$PROJECT_DIR/.backend.pid" ]; then
    local back_pid=$(cat "$PROJECT_DIR/.backend.pid" 2>/dev/null)
    if [ "$back_pid" = "$pid" ]; then
      return 0
    fi
  fi
  
  return 1
}

kill_process_by_port() {
  local PORT=$1
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  
  if [ -z "$pid" ]; then
    echo "端口 $PORT 没有进程在监听"
    return 0
  fi
  
  local cwd=$(get_process_cwd "$pid")
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  if is_project_process "$pid"; then
    echo "终止端口 $PORT 的进程 PID=$pid (cwd=$cwd)"
    kill "$pid" 2>/dev/null || true
    sleep 1
    
    local check_pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$check_pid" ]; then
      echo "进程未正常终止，强制杀死 PID=$check_pid"
      kill -9 "$check_pid" 2>/dev/null || true
    fi
  else
    echo "跳过终止端口 $PORT 的进程 PID=$pid: 不属于当前项目 (cwd=$cwd)"
    echo "  command: $cmd"
  fi
}

echo "=== 停止前端服务 (端口 $FRONTEND_PORT) ==="
kill_process_by_port $FRONTEND_PORT

echo "=== 停止后端服务 (端口 $BACKEND_PORT) ==="
kill_process_by_port $BACKEND_PORT

echo "=== 停止完成 ==="
