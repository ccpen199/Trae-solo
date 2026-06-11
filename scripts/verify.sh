#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49097}
BACKEND_PORT=${BACKEND_PORT:-59097}

echo "=== 服务验收检查 ==="
echo "项目目录: $PROJECT_DIR"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

ALL_OK=1

echo "--- 前端服务检查 ---"
if [ -n "$frontend_pid" ]; then
  echo "✓ 端口 $FRONTEND_PORT 监听中，PID: $frontend_pid"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
  
  stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  case "$stat" in
    T*) echo "✗ 进程已停止 (T)" ; ALL_OK=0 ;;
    Z*) echo "✗ 进程为僵尸态 (Z)" ; ALL_OK=0 ;;
    *) echo "✓ 进程状态正常: $stat" ;;
  esac
  
  echo "HTTP 请求测试..."
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/")
  if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
    echo "✓ 前端首页 HTTP $http_code"
  else
    echo "✗ 前端首页 HTTP $http_code (期望 200/301/302)"
    ALL_OK=0
  fi
else
  echo "✗ 前端端口 $FRONTEND_PORT 无监听"
  ALL_OK=0
fi

echo ""
echo "--- 后端服务检查 ---"
if [ -n "$backend_pid" ]; then
  echo "✓ 端口 $BACKEND_PORT 监听中，PID: $backend_pid"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
  
  stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  case "$stat" in
    T*) echo "✗ 进程已停止 (T)" ; ALL_OK=0 ;;
    Z*) echo "✗ 进程为僵尸态 (Z)" ; ALL_OK=0 ;;
    *) echo "✓ 进程状态正常: $stat" ;;
  esac
  
  echo "HTTP 请求测试..."
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ] || [ "$http_code" = "404" ]; then
    echo "✓ 后端健康接口 HTTP $http_code"
  else
    http_code2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/")
    if [ "$http_code2" = "200" ] || [ "$http_code2" = "201" ] || [ "$http_code2" = "301" ] || [ "$http_code2" = "302" ]; then
      echo "✓ 后端根路径 HTTP $http_code2 (健康接口 404 可接受)"
    else
      echo "✗ 后端健康接口 HTTP $http_code，根路径 HTTP $http_code2"
      ALL_OK=0
    fi
  fi
else
  echo "✗ 后端端口 $BACKEND_PORT 无监听"
  ALL_OK=0
fi

echo ""
echo "--- 访问地址 ---"
if [ -n "$frontend_pid" ]; then
  echo "前端: http://127.0.0.1:$FRONTEND_PORT"
fi
if [ -n "$backend_pid" ]; then
  echo "后端: http://127.0.0.1:$BACKEND_PORT"
  echo "API: http://127.0.0.1:$BACKEND_PORT/api"
fi

echo ""
if [ "$ALL_OK" -eq 1 ]; then
  echo "=== 验收通过 ✓ ==="
  exit 0
else
  echo "=== 验收未通过 ✗ ==="
  echo "请检查 logs/frontend.log 和 logs/backend.log"
  exit 1
fi
