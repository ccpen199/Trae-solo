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

is_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

listening_pid() {
  local port="$1"
  lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1
}

pid_matches_marker() {
  local pid="$1"
  local marker="$2"
  [[ -n "$pid" ]] || return 1
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

select_ports() {
  local base_frontend="$FRONTEND_PORT"
  local base_backend="$BACKEND_PORT"
  local offset frontend_candidate backend_candidate
  for offset in 0 100 200 300 400; do
    frontend_candidate=$((base_frontend + offset))
    backend_candidate=$((base_backend + offset))
    if port_available_or_owned "$frontend_candidate" "scripts/frontend_server.py" \
      && port_available_or_owned "$backend_candidate" "backend/server.py"; then
      if [[ "$frontend_candidate" != "$FRONTEND_PORT" || "$backend_candidate" != "$BACKEND_PORT" ]]; then
        set_env_key FRONTEND_PORT "$frontend_candidate"
        set_env_key BACKEND_PORT "$backend_candidate"
        set_env_key APP_PORT "$frontend_candidate"
        set_env_key FRONTEND_URL "http://127.0.0.1:${frontend_candidate}"
        set_env_key BACKEND_URL "http://127.0.0.1:${backend_candidate}"
        set_env_key API_BASE_URL "http://127.0.0.1:${backend_candidate}"
        set_env_key PORT "$backend_candidate"
        load_env
      fi
      return 0
    fi
  done
  echo "No available project port slot for ${base_frontend}/${base_backend}" >&2
  exit 1
}

ensure_tmux_service() {
  local session="$1"
  local port="$2"
  local marker="$3"
  local pid_file="$4"
  local log_file="$5"
  local command="$6"
  local pid

  if is_listening "$port"; then
    pid="$(listening_pid "$port")"
    if pid_matches_marker "$pid" "$marker"; then
      echo "$pid" > "$pid_file"
      return 0
    fi
    echo "${session} port ${port} is already in use by another process" >&2
    exit 1
  fi

  if command -v tmux >/dev/null 2>&1; then
    tmux has-session -t "$session" >/dev/null 2>&1 && tmux kill-session -t "$session" >/dev/null 2>&1 || true
    tmux new-session -d -s "$session" "cd \"$ROOT_DIR\" && exec $command >> \"$log_file\" 2>&1"
  else
    nohup bash -lc "cd \"$ROOT_DIR\" && exec $command" >> "$log_file" 2>&1 &
    disown "$!" 2>/dev/null || true
  fi

  for _ in {1..30}; do
    if is_listening "$port"; then
      pid="$(listening_pid "$port")"
      if pid_matches_marker "$pid" "$marker"; then
        echo "$pid" > "$pid_file"
        return 0
      fi
    fi
    sleep 0.2
  done

  echo "${session} did not start on ${port}" >&2
  tail -n 40 "$log_file" >&2 2>/dev/null || true
  exit 1
}

load_env

mkdir -p data
select_ports

ensure_tmux_service "may-89231-backend" "${BACKEND_PORT}" "backend/server.py" backend.pid backend.log "/usr/bin/python3 backend/server.py"
ensure_tmux_service "may-89231-frontend" "${FRONTEND_PORT}" "scripts/frontend_server.py" frontend.pid frontend.log "/usr/bin/python3 scripts/frontend_server.py"

echo "frontend=${FRONTEND_URL}"
echo "backend=${BACKEND_URL}"
