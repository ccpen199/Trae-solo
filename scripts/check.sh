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

echo "=== 项目端口与进程检查 ==="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "前端监听 PID: ${frontend_pid:-未监听}"
echo "后端监听 PID: ${backend_pid:-未监听}"
echo ""

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

check_process() {
  local pid=$1
  local name=$2
  local port=$3
  
  if [ -z "$pid" ]; then
    echo "❌ $name: 端口 $port 无监听进程"
    return 1
  fi
  
  local stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs)
  local cwd=$(get_process_cwd "$pid")
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  echo "$name 进程信息:"
  echo "  PID: $pid"
  echo "  状态: $stat"
  echo "  CWD: $cwd"
  echo "  命令: $cmd"
  
  if [ -z "$stat" ]; then
    echo "❌ $name: 进程 $pid 不存在"
    return 1
  fi
  
  case "$stat" in
    T*)
      echo "❌ $name: 进程处于停止态 (stat=$stat)"
      return 1
      ;;
    Z*)
      echo "❌ $name: 进程处于僵尸态 (stat=$stat)"
      return 1
      ;;
  esac
  
  if is_project_process "$pid"; then
    echo "✅ $name: 进程属于当前项目"
  else
    echo "⚠️  $name: 进程不属于当前项目 (cwd=$cwd)"
  fi
  
  return 0
}

echo "--- 前端进程检查 ---"
check_process "$frontend_pid" "前端" "$FRONTEND_PORT"
frontend_ok=$?
echo ""

echo "--- 后端进程检查 ---"
check_process "$backend_pid" "后端" "$BACKEND_PORT"
backend_ok=$?
echo ""

echo "--- HTTP 响应检查 ---"

echo "检查前端首页 http://127.0.0.1:$FRONTEND_PORT/ ..."
frontend_http=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 || echo "000")
if [ "$frontend_http" = "200" ]; then
  echo "✅ 前端首页返回 HTTP 200"
else
  echo "❌ 前端首页返回 HTTP $frontend_http"
  frontend_ok=1
fi
echo ""

echo "检查后端健康接口 http://127.0.0.1:$BACKEND_PORT/api/health ..."
backend_resp=$(curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 || echo "ERROR")
backend_http=$(echo "$backend_resp" | head -c 100 | grep -o '"status"\s*:\s*"ok"' || true)
if [ -n "$backend_http" ]; then
  echo "✅ 后端健康接口返回正常: $backend_resp"
else
  echo "❌ 后端健康接口异常: $backend_resp"
  backend_ok=1
fi
echo ""

echo "=== 检查总结 ==="
if [ $frontend_ok -eq 0 ] && [ $backend_ok -eq 0 ]; then
  echo "✅ 所有检查通过！"
  echo "前端地址: http://127.0.0.1:$FRONTEND_PORT/"
  echo "后端地址: http://127.0.0.1:$BACKEND_PORT/"
  exit 0
else
  echo "❌ 检查未通过，请查看日志排查问题"
  echo "前端日志: $PROJECT_DIR/frontend.log"
  echo "后端日志: $PROJECT_DIR/backend.log"
  exit 1
fi
