#!/bin/zsh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env

echo "=========================================="
echo "停止项目服务"
echo "=========================================="

for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    pid_info=$(ps -p "$pid" -o pid=,args= 2>/dev/null || true)
    pid_cwd=$(lsof -p "$pid" -d cwd -F n 2>/dev/null | tail -1 | sed 's/^n//' || true)
    
    if [[ "$pid_cwd" == "$PROJECT_DIR"* ]] || [[ "$pid_info" == *"$PROJECT_DIR"* ]] || [[ "$pid_info" == *"vite"* ]] || [[ "$pid_info" == *"node src/server"* ]]; then
      echo "  终止进程 PID=$pid (端口 $PORT)"
      kill "$pid" 2>/dev/null || true
    else
      echo "  跳过 PID=$pid (端口 $PORT) - 非当前项目进程"
      echo "    工作目录: $pid_cwd"
      echo "    命令: $pid_info"
    fi
  else
    echo "  端口 $PORT 无监听进程"
  fi
done

sleep 1

echo ""
echo "检查残留进程..."
for pid in $(pgrep -f "node src/server" 2>/dev/null); do
  pid_cwd=$(lsof -p "$pid" -d cwd -F n 2>/dev/null | tail -1 | sed 's/^n//' || true)
  if [[ "$pid_cwd" == "$PROJECT_DIR"* ]]; then
    echo "  终止残留后端进程 PID=$pid"
    kill "$pid" 2>/dev/null || true
  fi
done

for pid in $(pgrep -f "vite --host" 2>/dev/null); do
  pid_cwd=$(lsof -p "$pid" -d cwd -F n 2>/dev/null | tail -1 | sed 's/^n//' || true)
  if [[ "$pid_cwd" == "$PROJECT_DIR"* ]]; then
    echo "  终止残留前端进程 PID=$pid"
    kill "$pid" 2>/dev/null || true
  fi
done

echo ""
echo "✅ 服务已停止"
echo "=========================================="
