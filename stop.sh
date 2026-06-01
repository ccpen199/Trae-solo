#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env

echo "=========================================="
echo "停止消防接处警系统"
echo "=========================================="

kill_port_process() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  
  if [ -z "$pid" ]; then
    echo "端口 $port 无进程监听"
    return 0
  fi
  
  local cwd=""
  if ps -o cwd= -p "$pid" >/dev/null 2>&1; then
    cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  fi
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  local belongs=false
  if [ -n "$cwd" ]; then
    case "$cwd" in "$PROJECT_DIR"*) belongs=true ;; esac
  fi
  if [ "$belongs" = false ] && [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
    belongs=true
  fi
  
  if [ "$belongs" = true ]; then
    echo "终止端口 $port 进程 (PID: $pid, cwd: $cwd)"
    kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      echo "进程未响应，强制终止..."
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "已终止端口 $port 进程"
  else
    echo "跳过端口 $port 进程 (PID: $pid)，不属于当前项目"
    [ -n "$cwd" ] && echo "  cwd: $cwd"
    echo "  cmd: $cmd"
  fi
}

echo "停止前端服务 (端口 $FRONTEND_PORT)..."
kill_port_process $FRONTEND_PORT

echo ""
echo "停止后端服务 (端口 $BACKEND_PORT)..."
kill_port_process $BACKEND_PORT

echo ""
echo "=========================================="
echo "服务已停止"
echo "=========================================="
