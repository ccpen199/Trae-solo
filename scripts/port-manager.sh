#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

tail4="9102"

get_ports_for_slot() {
  local slot=$1
  local offset=$((slot * 1000))
  echo "$((40000 + offset + tail4)) $((50000 + offset + tail4))"
}

port_in_use() {
  local port=$1
  lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1
}

update_env_ports() {
  local frontend_port=$1
  local backend_port=$2

  sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" "$ENV_FILE"
  sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" "$ENV_FILE"
  sed -i '' "s/^APP_PORT=.*/APP_PORT=$frontend_port/" "$ENV_FILE"
  sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
  sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" "$ENV_FILE"
  sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
  sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
}

check_and_allocate_ports() {
  for slot in 0 1 2 3 4 5; do
    read frontend_port backend_port < <(get_ports_for_slot $slot)

    if ! port_in_use $frontend_port && ! port_in_use $backend_port; then
      if [ $slot -gt 0 ]; then
        echo "⚠️  默认端口被占用，使用槽位 $slot: 前端 $frontend_port, 后端 $backend_port"
        update_env_ports $frontend_port $backend_port
      fi
      echo "✅ 端口分配完成: FRONTEND_PORT=$frontend_port, BACKEND_PORT=$backend_port"
      return 0
    fi

    if port_in_use $frontend_port; then
      local pid=$(lsof -nP -iTCP:$frontend_port -sTCP:LISTEN -t | head -n1)
      local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "unknown")
      local cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "unknown")
      echo "⚠️  端口 $frontend_port 被占用: PID=$pid, cwd=$cwd, cmd=$cmd"
    fi
    if port_in_use $backend_port; then
      local pid=$(lsof -nP -iTCP:$backend_port -sTCP:LISTEN -t | head -n1)
      local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "unknown")
      local cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "unknown")
      echo "⚠️  端口 $backend_port 被占用: PID=$pid, cwd=$cwd, cmd=$cmd"
    fi
  done

  echo "❌ 所有槽位端口均被占用，请手动释放端口或修改端口配置"
  exit 1
}

kill_pid_if_belongs_to_project() {
  local pid=$1
  local project_dir=$2

  if [ -z "$pid" ]; then
    return 0
  fi

  local cwd=$(lsof -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)

  case "$cwd" in
    "$project_dir"*)
      echo "🔪 终止进程 PID=$pid (cwd=$cwd)"
      kill "$pid" 2>/dev/null || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      ;;
    *)
      echo "⏭️  跳过 PID=$pid: cwd=$cwd 不属于当前项目"
      ;;
  esac
}

stop_port_processes() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  kill_pid_if_belongs_to_project "$pid" "$PROJECT_DIR"
}

case "$1" in
  check)
    check_and_allocate_ports
    ;;
  stop-frontend)
    source "$ENV_FILE"
    stop_port_processes "$FRONTEND_PORT"
    ;;
  stop-backend)
    source "$ENV_FILE"
    stop_port_processes "$BACKEND_PORT"
    ;;
  stop-all)
    source "$ENV_FILE"
    stop_port_processes "$FRONTEND_PORT"
    stop_port_processes "$BACKEND_PORT"
    ;;
  status)
    source "$ENV_FILE"
    echo "=== 项目端口状态 ==="
    echo "项目目录: $PROJECT_DIR"
    echo "前端端口: $FRONTEND_PORT ($FRONTEND_URL)"
    echo "后端端口: $BACKEND_PORT ($BACKEND_URL)"
    echo ""

    for port in $FRONTEND_PORT $BACKEND_PORT; do
      local_pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
      if [ -n "$local_pid" ]; then
        echo "✅ 端口 $port 被 PID=$local_pid 占用"
        ps -p "$local_pid" -o pid=,ppid=,stat=,cwd=,command=
      else
        echo "⬜ 端口 $port 空闲"
      fi
      echo ""
    done
    ;;
  *)
    echo "用法: $0 {check|stop-frontend|stop-backend|stop-all|status}"
    exit 1
    ;;
esac
