#!/bin/bash
set +e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
ORDER_NAME="$(basename "$PROJECT_DIR")"
FRONTEND_SESSION="${ORDER_NAME}-frontend"
BACKEND_SESSION="${ORDER_NAME}-backend"

echo "========================================"
echo " 停止服务脚本"
echo "========================================"
echo ""

source "$ENV_FILE"

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

kill_by_port() {
  local port=$1
  local label=$2
  
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  
  if [ -n "$pid" ]; then
    local cwd=$(get_process_cwd "$pid")
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
    
    case "$cwd" in
      "$PROJECT_DIR"/*)
        echo "  停止 $label (端口 $port, PID $pid..."
        kill "$pid" 2>/dev/null || true
        sleep 1
        if kill -0 "$pid" 2>/dev/null 2>&1; then
          echo "    优雅停止失败，强制终止..."
          kill -9 "$pid" 2>/dev/null || true
        fi
        echo "    ✓ 已停止"
        ;;
      *)
        echo "  跳过 $label: PID $pid 不属于当前项目，不终止"
        echo "    cwd: $cwd"
        echo "    cmd: $cmd"
        ;;
    esac
  else
    echo "  $label 端口 $port 无进程"
  fi
}

kill_by_file() {
  local pid_file=$1
  local label=$2
  
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if [ -n "$pid" ]; then
      local cwd=$(get_process_cwd "$pid")
      case "$cwd" in
        "$PROJECT_DIR"/*)
          echo "  停止 $label (PID: $pid)..."
          kill "$pid" 2>/dev/null || true
          sleep 1
          if kill -0 "$pid" 2>/dev/null 2>&1; then
            kill -9 "$pid" 2>/dev/null || true
          fi
          echo "    ✓ 已停止"
          ;;
      esac
    fi
    rm -f "$pid_file"
  fi
}

kill_tmux_session() {
  local session=$1
  local label=$2

  if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$session" 2>/dev/null; then
    echo "  停止 $label tmux 会话 ($session)..."
    tmux kill-session -t "$session" 2>/dev/null || true
    echo "    ✓ 已停止"
  fi
}

echo ""
echo "停止前端服务..."
kill_by_port "$FRONTEND_PORT" "前端"
kill_by_file "$PROJECT_DIR/.frontend.pid" "前端"
kill_tmux_session "$FRONTEND_SESSION" "前端"

echo ""
echo "停止后端服务..."
kill_by_port "$BACKEND_PORT" "后端"
kill_by_file "$PROJECT_DIR/.backend.pid" "后端"
kill_tmux_session "$BACKEND_SESSION" "后端"

echo ""
echo "========================================"
echo "  ✓ 所有服务已停止"
echo "========================================"
echo ""
echo "端口状态:"
echo "  前端 $FRONTEND_PORT: $(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1 || echo "空闲")"
echo "  后端 $BACKEND_PORT: $(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1 || echo "空闲")"
echo ""
