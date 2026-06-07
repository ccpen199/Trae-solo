#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env 2>/dev/null
FRONTEND_PORT=${FRONTEND_PORT:-49022}
BACKEND_PORT=${BACKEND_PORT:-59022}

echo "========================================"
echo "  停止丰巢快递员SaaS平台服务"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo "========================================"

stop_port() {
  local PORT=$1
  local NAME=$2
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  
  if [ -n "$pid" ]; then
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
    
    if echo "$cmd" | grep -q "may-89022"; then
      kill "$pid" 2>/dev/null
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null
      fi
      echo "$NAME (端口 $PORT, PID $pid) 已停止"
    else
      echo "$NAME (端口 $PORT, PID $pid) 不属于当前项目，跳过"
    fi
  else
    echo "$NAME (端口 $PORT) 未运行"
  fi
}

stop_port $FRONTEND_PORT "前端服务"
stop_port $BACKEND_PORT "后端服务"

echo ""
echo "服务已停止"
echo "========================================"
