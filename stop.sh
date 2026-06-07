#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_PORT=49032
BACKEND_PORT=59032

echo "=== 检查前端端口 $FRONTEND_PORT ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$frontend_pid" ]; then
  cwd=$(lsof -p "$frontend_pid" | grep cwd | awk '{print $NF}')
  cmd=$(ps -o command= -p "$frontend_pid")
  echo "frontend_pid=$frontend_pid, cwd=$cwd, cmd=$cmd"
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "属于当前项目，正在关闭..."
      kill "$frontend_pid"
      echo "已关闭前端进程 $frontend_pid"
      ;;
    *)
      echo "不属于当前项目，跳过: cwd=$cwd cmd=$cmd"
      ;;
  esac
else
  echo "前端端口未占用"
fi

echo ""
echo "=== 检查后端端口 $BACKEND_PORT ==="
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  cwd=$(lsof -p "$backend_pid" | grep cwd | awk '{print $NF}')
  cmd=$(ps -o command= -p "$backend_pid")
  echo "backend_pid=$backend_pid, cwd=$cwd, cmd=$cmd"
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "属于当前项目，正在关闭..."
      kill "$backend_pid"
      echo "已关闭后端进程 $backend_pid"
      ;;
    *)
      echo "不属于当前项目，跳过: cwd=$cwd cmd=$cmd"
      ;;
  esac
else
  echo "后端端口未占用"
fi

echo ""
echo "=== 所有服务已停止 ==="
