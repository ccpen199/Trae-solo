#!/bin/bash
set +e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  source .env
else
  echo "❌ .env 文件不存在"
  exit 1
fi

echo "=== 项目验收检查 ==="
echo "项目目录: $PROJECT_DIR"
echo "前端地址: $FRONTEND_URL"
echo "后端地址: $BACKEND_URL"
echo ""

ALL_PASSED=true

check_port_listening() {
  local port=$1
  local name=$2
  local pid

  pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)

  if [ -n "$pid" ]; then
    echo "✅ $name 端口 $port 监听中 (PID=$pid)"
    return 0
  else
    echo "❌ $name 端口 $port 未监听"
    return 1
  fi
}

check_process_status() {
  local pid=$1
  local name=$2

  if [ -z "$pid" ]; then
    echo "❌ $name 进程不存在"
    return 1
  fi

  local stat
  stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs)

  if [ -z "$stat" ]; then
    echo "❌ $name 进程 PID=$pid 不存在"
    return 1
  fi

  case "$stat" in
    T*|Z*)
      echo "❌ $name 进程异常: PID=$pid, stat=$stat"
      return 1
      ;;
    *)
      local cwd cmd
      cwd=$(lsof -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
      cmd=$(ps -o command= -p "$pid" 2>/dev/null | head -c 80)
      echo "✅ $name 进程正常: PID=$pid, stat=$stat"
      echo "   cwd: $cwd"
      echo "   cmd: $cmd..."
      return 0
      ;;
  esac
}

check_http() {
  local url=$1
  local name=$2
  local expected_status="${3:-200}"

  local response
  response=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "$url" 2>&1)

  if [ "$response" = "$expected_status" ] || [[ "$response" =~ ^2[0-9][0-9]$ ]] || [[ "$response" =~ ^3[0-9][0-9]$ ]]; then
    echo "✅ $name HTTP 检查通过: $url -> $response"
    return 0
  else
    echo "❌ $name HTTP 检查失败: $url -> $response (期望 $expected_status 或 2xx/3xx)"
    return 1
  fi
}

echo "--- 端口监听检查 ---"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

if [ -d frontend ] && ls frontend/package.json >/dev/null 2>&1; then
  check_port_listening $FRONTEND_PORT "前端" || ALL_PASSED=false
fi

if [ -d backend ] && (ls backend/package.json >/dev/null 2>&1 || ls backend/app.py >/dev/null 2>&1); then
  check_port_listening $BACKEND_PORT "后端" || ALL_PASSED=false
fi

echo ""
echo "--- 进程状态检查 ---"
if [ -n "$frontend_pid" ]; then
  check_process_status "$frontend_pid" "前端" || ALL_PASSED=false
fi
if [ -n "$backend_pid" ]; then
  check_process_status "$backend_pid" "后端" || ALL_PASSED=false
fi

echo ""
echo "--- HTTP 访问检查 ---"
if [ -d frontend ] && ls frontend/package.json >/dev/null 2>&1; then
  check_http "$FRONTEND_URL/" "前端首页" || ALL_PASSED=false
fi

if [ -d backend ] && (ls backend/package.json >/dev/null 2>&1 || ls backend/app.py >/dev/null 2>&1); then
  check_http "$BACKEND_URL/api/health" "后端健康检查" || check_http "$BACKEND_URL/health" "后端健康检查" || ALL_PASSED=false
fi

echo ""
echo "=== 验收结果 ==="
if $ALL_PASSED; then
  echo "✅ 所有检查通过！项目已成功启动"
  echo ""
  echo "📋 访问地址:"
  echo "   前端: $FRONTEND_URL"
  echo "   后端: $BACKEND_URL"
  echo "   API:  $API_BASE_URL"
  echo ""
  echo "📄 日志文件:"
  [ -f frontend.log ] && echo "   前端日志: $PROJECT_DIR/frontend.log"
  [ -f backend.log ] && echo "   后端日志: $PROJECT_DIR/backend.log"
  exit 0
else
  echo "❌ 部分检查未通过，请查看日志排查问题"
  [ -f frontend.log ] && echo "📄 前端日志: $PROJECT_DIR/frontend.log"
  [ -f backend.log ] && echo "📄 后端日志: $PROJECT_DIR/backend.log"
  exit 1
fi
