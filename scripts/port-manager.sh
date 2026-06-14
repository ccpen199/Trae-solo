#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

load_env() {
  if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi
}

get_tail4() {
  local dirname=$(basename "$PROJECT_DIR")
  local num=$(echo "$dirname" | grep -oE '[0-9]+' | head -n1)
  printf "%04d" "${num: -4}"
}

calculate_ports() {
  local slot=$1
  local tail4=$(get_tail4)
  local frontend_base=$((40000 + slot * 1000))
  local backend_base=$((50000 + slot * 1000))
  echo "$((frontend_base + 10#$tail4)) $((backend_base + 10#$tail4))"
}

get_pid_cwd() {
  local pid=$1
  local cwd=""
  if command -v pwdx >/dev/null 2>&1; then
    cwd=$(pwdx "$pid" 2>/dev/null | sed 's/^[0-9]*: *//')
  fi
  if [ -z "$cwd" ] && [ -d "/proc/$pid" ]; then
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || echo "")
  fi
  if [ -z "$cwd" ]; then
    cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1)
  fi
  echo "$cwd"
}

is_port_available() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(get_pid_cwd "$pid")
    if [[ "$cwd" == "$PROJECT_DIR"/* ]]; then
      return 0
    fi
    return 1
  fi
  return 0
}

find_available_ports() {
  for slot in 0 1 2 3 4 5; do
    read frontend_port backend_port <<< $(calculate_ports $slot)
    if is_port_available $frontend_port && is_port_available $backend_port; then
      echo "$frontend_port $backend_port"
      return 0
    fi
    echo "槽位 $slot 端口 $frontend_port/$backend_port 被占用，尝试下一个..." >&2
  done
  echo "错误：所有端口槽位都被占用！" >&2
  exit 1
}

update_env() {
  local frontend_port=$1
  local backend_port=$2
  
  sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" "$ENV_FILE"
  sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" "$ENV_FILE"
  sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
  sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" "$ENV_FILE"
  sed -i.bak "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
  sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
  sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
  
  echo "端口已更新: FRONTEND_PORT=$frontend_port, BACKEND_PORT=$backend_port"
}

case "$1" in
  check)
    load_env
    echo "当前配置端口: FRONTEND_PORT=${FRONTEND_PORT:-未设置}, BACKEND_PORT=${BACKEND_PORT:-未设置}"
    if [ -n "$FRONTEND_PORT" ]; then
      echo "前端端口 $FRONTEND_PORT:"
      pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
      if [ -n "$pid" ]; then
        ps -p "$pid" -o pid=,ppid=,stat=,cwd=,command=
      else
        echo "  空闲"
      fi
    fi
    if [ -n "$BACKEND_PORT" ]; then
      echo "后端端口 $BACKEND_PORT:"
      pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
      if [ -n "$pid" ]; then
        ps -p "$pid" -o pid=,ppid=,stat=,cwd=,command=
      else
        echo "  空闲"
      fi
    fi
    ;;
  auto)
    read frontend_port backend_port <<< $(find_available_ports)
    load_env
    if [ "$frontend_port" != "${FRONTEND_PORT:-}" ] || [ "$backend_port" != "${BACKEND_PORT:-}" ]; then
      update_env $frontend_port $backend_port
    else
      echo "当前端口可用: $frontend_port/$backend_port"
    fi
    ;;
  show)
    tail4=$(get_tail4)
    echo "项目目录: $(basename "$PROJECT_DIR")"
    echo "tail4: $tail4"
    echo "--- 端口槽位 ---"
    for slot in 0 1 2 3 4 5; do
      read fp bp <<< $(calculate_ports $slot)
      status=""
      if ! is_port_available $fp || ! is_port_available $bp; then
        status=" [占用]"
      fi
      echo "槽位 $slot: $fp/$bp$status"
    done
    ;;
  *)
    echo "用法: $0 {check|auto|show}"
    exit 1
    ;;
esac
