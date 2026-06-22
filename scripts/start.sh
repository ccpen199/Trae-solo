#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

load_env() {
  while IFS='=' read -r key value; do
    case "$key" in
      ''|\#*) continue ;;
      *) export "$key=$value" ;;
    esac
  done < .env
}

set_env_key() {
  local key="$1"
  local value="$2"
  local tmp_file
  tmp_file="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    $0 ~ "^" key "=" { print key "=" value; found = 1; next }
    { print }
    END { if (!found) print key "=" value }
  ' .env > "$tmp_file"
  mv "$tmp_file" .env
}

is_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

listening_pid() {
  local port="$1"
  lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1
}

pid_in_project() {
  local pid="$1"
  [[ -n "$pid" ]] || return 1
  local cwd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"
  [[ "$cwd" == "$ROOT_DIR"* ]]
}

pid_matches_marker() {
  local pid="$1"
  local marker="$2"
  [[ -n "$pid" ]] || return 1
  pid_in_project "$pid" || return 1
  ps -p "$pid" -o command= 2>/dev/null | grep -F "$marker" >/dev/null
}

port_available_or_owned() {
  local port="$1"
  local marker="$2"
  if ! is_listening "$port"; then
    return 0
  fi
  local pid
  pid="$(listening_pid "$port")"
  pid_matches_marker "$pid" "$marker"
}

stop_owned_process() {
  local port="$1"
  local marker="$2"
  local pid

  if ! is_listening "$port"; then
    return 0
  fi

  pid="$(listening_pid "$port")"

  if ! pid_matches_marker "$pid" "$marker"; then
    return 0
  fi

  kill "$pid" >/dev/null 2>&1 || true

  for _ in {1..30}; do
    if ! is_listening "$port"; then
      return 0
    fi
    sleep 0.2
  done

  echo "Timed out stopping project-owned process on ${port}" >&2
  exit 1
}

select_ports() {
  local base_frontend="$FRONTEND_PORT"
  local base_backend="$BACKEND_PORT"
  local offset frontend_candidate backend_candidate

  for offset in 0 100 200 300 400; do
    frontend_candidate=$((base_frontend + offset))
    backend_candidate=$((base_backend + offset))
    if port_available_or_owned "$frontend_candidate" "node_modules/.bin/vite" \
      && port_available_or_owned "$backend_candidate" "backend/server.mjs"; then
      if [[ "$frontend_candidate" != "$FRONTEND_PORT" || "$backend_candidate" != "$BACKEND_PORT" ]]; then
        set_env_key FRONTEND_PORT "$frontend_candidate"
        set_env_key BACKEND_PORT "$backend_candidate"
        set_env_key APP_PORT "$frontend_candidate"
        set_env_key PORT "$backend_candidate"
        set_env_key FRONTEND_URL "http://127.0.0.1:${frontend_candidate}"
        set_env_key BACKEND_URL "http://127.0.0.1:${backend_candidate}"
        set_env_key API_BASE_URL "http://127.0.0.1:${backend_candidate}"
        load_env
      fi
      return 0
    fi
  done

  echo "No available project port slot for ${base_frontend}/${base_backend}" >&2
  exit 1
}

start_service() {
  local session_name="$1"
  local port="$2"
  local marker="$3"
  local pid_file="$4"
  local log_file="$5"
  local command="$6"
  local pid

  stop_owned_process "$port" "$marker"

  if is_listening "$port"; then
    echo "Port ${port} is already in use by another process" >&2
    exit 1
  fi

  rm -f "$pid_file"
  touch "$log_file"

  if command -v tmux >/dev/null 2>&1; then
    tmux has-session -t "$session_name" >/dev/null 2>&1 && tmux kill-session -t "$session_name" >/dev/null 2>&1 || true
    tmux new-session -d -s "$session_name" "cd \"$ROOT_DIR\" && exec $command >> \"$ROOT_DIR/$log_file\" 2>&1"
  else
    nohup bash -lc "cd \"$ROOT_DIR\" && exec $command" >> "$log_file" 2>&1 < /dev/null &
    disown "$!" 2>/dev/null || true
  fi

  for _ in {1..50}; do
    if is_listening "$port"; then
      pid="$(listening_pid "$port")"
      if pid_matches_marker "$pid" "$marker"; then
        echo "$pid" > "$pid_file"
        return 0
      fi
    fi
    sleep 0.2
  done

  echo "Service did not start on ${port}" >&2
  tail -n 40 "$log_file" >&2 2>/dev/null || true
  exit 1
}

load_env
select_ports

start_service "may-89313-backend" "${BACKEND_PORT}" "backend/server.mjs" backend.pid backend.log "node backend/server.mjs"
start_service "may-89313-frontend" "${FRONTEND_PORT}" "node_modules/.bin/vite" frontend.pid frontend.log "./node_modules/.bin/vite --host ${HOST} --port ${FRONTEND_PORT} --strictPort"

echo "frontend=${FRONTEND_URL}"
echo "backend=${BACKEND_URL}"
