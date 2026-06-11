#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49097}
BACKEND_PORT=${BACKEND_PORT:-59097}

echo "=== 端口占用检查 ==="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

FRONTEND_OCCUPIED=0
BACKEND_OCCUPIED=0

if [ -n "$frontend_pid" ]; then
  FRONTEND_OCCUPIED=1
  cwd=$(ps -o cwd= -p "$frontend_pid" 2>/dev/null | xargs)
  cmd=$(ps -o command= -p "$frontend_pid" 2>/dev/null)
  echo "前端端口 $FRONTEND_PORT 已被占用:"
  echo "  PID: $frontend_pid"
  echo "  CWD: $cwd"
  echo "  CMD: $cmd"
  case "$cwd" in
    "$PROJECT_DIR"/*) echo "  归属: 本项目进程" ;;
    *) echo "  归属: 其他项目进程，不可终止" ;;
  esac
else
  echo "前端端口 $FRONTEND_PORT 可用 ✓"
fi

if [ -n "$backend_pid" ]; then
  BACKEND_OCCUPIED=1
  cwd=$(ps -o cwd= -p "$backend_pid" 2>/dev/null | xargs)
  cmd=$(ps -o command= -p "$backend_pid" 2>/dev/null)
  echo "后端端口 $BACKEND_PORT 已被占用:"
  echo "  PID: $backend_pid"
  echo "  CWD: $cwd"
  echo "  CMD: $cmd"
  case "$cwd" in
    "$PROJECT_DIR"/*) echo "  归属: 本项目进程" ;;
    *) echo "  归属: 其他项目进程，不可终止" ;;
  esac
else
  echo "后端端口 $BACKEND_PORT 可用 ✓"
fi

if [ "$FRONTEND_OCCUPIED" -eq 1 ] || [ "$BACKEND_OCCUPIED" -eq 1 ]; then
  exit 1
fi

exit 0
