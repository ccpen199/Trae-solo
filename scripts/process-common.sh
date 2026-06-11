#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

load_env() {
  if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi
}

is_project_pid() {
  local pid=$1
  if [ -z "$pid" ]; then
    return 1
  fi
  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  case "$cwd" in
    "$PROJECT_DIR"/*) return 0 ;;
    *) return 1 ;;
  esac
}

get_pid_by_port() {
  local port=$1
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1
}

kill_project_pid() {
  local pid=$1
  if [ -z "$pid" ] && is_project_pid "$pid"; then
    kill "$pid" 2>/dev/null || true
    sleep 0.5
    kill -9 "$pid" 2>/dev/null || true
  fi
}

kill_project_port() {
  local port=$1
  local pid
  pid=$(get_pid_by_port "$port")
  if [ -z "$pid" ]; then
    return 0
  fi
  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "Killing pid $pid on port $port (cwd=$cwd)"
      kill "$pid" 2>/dev/null || true
      sleep 0.5
      ;;
    *)
      echo "skip kill: cwd=$cwd cmd=$cmd"
      return 1
      ;;
  esac
}

check_port_listening() {
  local port=$1
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

check_process_alive() {
  local pid=$1
  if [ -z "$pid" ]; then
    return 1
  fi
  local stat
  stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs)
  case "$stat" in
    *T*|*Z*|"") return 1 ;;
    *) return 0 ;;
  esac
}

verify_service() {
  local port=$1
  local pid
  pid=$(get_pid_by_port "$port")

  if [ -z "$pid" ]; then
    echo "FAIL: No process listening on port $port"
    return 1
  fi

  if ! check_process_alive "$pid"; then
    echo "FAIL: Process $pid on port $port is not running properly"
    return 1
  fi

  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  if ! is_project_pid "$pid"; then
    echo "WARN: Process $pid cwd=$cwd is outside project directory"
    return 1
  fi

  echo "OK: Port $port, PID $pid, cwd=$cwd"
  return 0
}
