#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
NODE_BIN="$(command -v node)"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

tail4="$(basename "$PROJECT_DIR" | sed -E 's/.*-([0-9]+)$/\1/' | tail -c 5)"
tail_num=$((10#$tail4))
FRONTEND_PORT="${FRONTEND_PORT:-$((40000 + tail_num))}"
BACKEND_PORT="${BACKEND_PORT:-$((50000 + tail_num))}"

port_pid() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true
}

pid_in_project() {
  local pid="$1"
  local cwd cmd
  [ -n "$pid" ] || return 1
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^n/ {print substr($0, 2); exit}')"
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  case "$cwd" in
    "$PROJECT_DIR"|"$PROJECT_DIR"/*) return 0 ;;
  esac
  case "$cmd" in
    *"$PROJECT_DIR"*) return 0 ;;
  esac
  return 1
}

stop_project_pid() {
  local pid="$1"
  [ -n "$pid" ] || return 0
  if ! ps -p "$pid" >/dev/null 2>&1; then
    return 0
  fi
  if ! pid_in_project "$pid"; then
    echo "skip kill for pid $pid: not owned by $PROJECT_DIR"
    return 1
  fi
  kill "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if ! ps -p "$pid" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.3
  done
  if pid_in_project "$pid"; then
    kill -9 "$pid" 2>/dev/null || true
  fi
}

write_env_ports() {
  local frontend_port="$1"
  local backend_port="$2"
  local tmp="$ENV_FILE.tmp"
  touch "$ENV_FILE"
  awk -v fp="$frontend_port" -v bp="$backend_port" '
    BEGIN { seen_frontend = 0; seen_backend = 0; seen_vite_api = 0 }
    /^FRONTEND_PORT=/ { print "FRONTEND_PORT=" fp; seen_frontend = 1; next }
    /^BACKEND_PORT=/ { print "BACKEND_PORT=" bp; seen_backend = 1; next }
    /^VITE_API_BASE_URL=/ { print "VITE_API_BASE_URL=http://127.0.0.1:" bp "/api"; seen_vite_api = 1; next }
    { print }
    END {
      if (!seen_frontend) print "FRONTEND_PORT=" fp
      if (!seen_backend) print "BACKEND_PORT=" bp
      if (!seen_vite_api) print "VITE_API_BASE_URL=http://127.0.0.1:" bp "/api"
    }
  ' "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
}

port_blocked_by_other() {
  local pid
  pid="$(port_pid "$1")"
  [ -n "$pid" ] || return 1
  pid_in_project "$pid" && return 1
  return 0
}

wait_for_project_port() {
  local port="$1"
  local pid
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    pid="$(port_pid "$port")"
    if [ -n "$pid" ] && pid_in_project "$pid"; then
      echo "$pid"
      return 0
    fi
    sleep 0.5
  done
  return 1
}

start_detached() {
  local name="$1"
  local cwd="$2"
  local log="$3"
  local err="$4"
  shift 4

  if command -v screen >/dev/null 2>&1; then
    screen -dmS "$name" bash -lc 'cd "$1"; log="$2"; err="$3"; shift 3; exec "$@" > "$log" 2> "$err"' _ "$cwd" "$log" "$err" "$@"
  else
    nohup "$@" > "$log" 2> "$err" < /dev/null &
    disown || true
  fi
}

choose_ports() {
  if ! port_blocked_by_other "$FRONTEND_PORT" && ! port_blocked_by_other "$BACKEND_PORT"; then
    write_env_ports "$FRONTEND_PORT" "$BACKEND_PORT"
    return 0
  fi

  for base in 40 41 42 43 44 45; do
    local fp=$((base * 1000 + tail_num))
    local bp=$(((base + 10) * 1000 + tail_num))
    if ! port_blocked_by_other "$fp" && ! port_blocked_by_other "$bp"; then
      FRONTEND_PORT="$fp"
      BACKEND_PORT="$bp"
      write_env_ports "$FRONTEND_PORT" "$BACKEND_PORT"
      return 0
    fi
  done

  echo "No available project port slot for tail $tail4"
  exit 1
}

choose_ports

for pid_file in "$PROJECT_DIR/frontend.pid" "$PROJECT_DIR/backend.pid"; do
  if [ -f "$pid_file" ]; then
    stop_project_pid "$(cat "$pid_file" 2>/dev/null || true)" || true
  fi
done

for port in "$FRONTEND_PORT" "$BACKEND_PORT"; do
  pid="$(port_pid "$port")"
  if [ -n "$pid" ]; then
    stop_project_pid "$pid" || true
  fi
done

: > "$PROJECT_DIR/frontend.log"
: > "$PROJECT_DIR/frontend.err.log"
: > "$PROJECT_DIR/backend.log"
: > "$PROJECT_DIR/backend.err.log"

echo "Starting backend on http://127.0.0.1:$BACKEND_PORT"
start_detached "may-89044-backend" "$PROJECT_DIR/backend" "$PROJECT_DIR/backend.log" "$PROJECT_DIR/backend.err.log" \
  "$NODE_BIN" "$PROJECT_DIR/backend/node_modules/.bin/tsx" src/index.ts

sleep 3

echo "Starting frontend on http://127.0.0.1:$FRONTEND_PORT"
start_detached "may-89044-frontend" "$PROJECT_DIR/frontend" "$PROJECT_DIR/frontend.log" "$PROJECT_DIR/frontend.err.log" \
  "$NODE_BIN" "$PROJECT_DIR/frontend/node_modules/.bin/vite" --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort

sleep 5

echo "Verifying services"
wait_for_project_port "$BACKEND_PORT" > "$PROJECT_DIR/backend.pid"
wait_for_project_port "$FRONTEND_PORT" > "$PROJECT_DIR/frontend.pid"
lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN
lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN
curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/"
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health"
echo
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
