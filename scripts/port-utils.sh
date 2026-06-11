#!/usr/bin/env bash

load_project_env() {
  if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source ./.env
    set +a
  fi
}

port_listener_pid() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n1
}

process_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

process_command() {
  ps -o command= -p "$1" 2>/dev/null || true
}

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"

  if [ -f .env ]; then
    awk -v key="$key" -v value="$value" '
      BEGIN { done = 0 }
      $0 ~ "^" key "=" {
        print key "=" value
        done = 1
        next
      }
      { print }
      END {
        if (!done) {
          print key "=" value
        }
      }
    ' .env > "$tmp"
  else
    printf '%s=%s\n' "$key" "$value" > "$tmp"
  fi

  mv "$tmp" .env
}

write_backend_env() {
  local port="$1"
  set_env_value BACKEND_PORT "$port"
  set_env_value BACKEND_URL "http://127.0.0.1:$port"
  set_env_value API_BASE_URL "http://127.0.0.1:$port/api"
  set_env_value VITE_API_URL "http://127.0.0.1:$port/api"
}

write_frontend_env() {
  local port="$1"
  set_env_value FRONTEND_PORT "$port"
  set_env_value APP_PORT "$port"
  set_env_value FRONTEND_URL "http://127.0.0.1:$port"
}

resolve_port() {
  local preferred="$1"
  local project_dir="$2"
  local command_marker="$3"
  local current="$preferred"
  local attempt

  for attempt in 0 1 2 3 4; do
    current=$((preferred + attempt * 1000))
    local pid
    pid="$(port_listener_pid "$current")"

    if [ -z "$pid" ]; then
      printf '%s\n' "$current"
      return 0
    fi

    local cwd
    local cmd
    cwd="$(process_cwd "$pid")"
    cmd="$(process_command "$pid")"

    if [ "$cwd" = "$project_dir" ] && echo "$cmd" | grep -q "$command_marker"; then
      echo "Stopping existing $command_marker process on port $current: $pid" >&2
      kill "$pid" 2>/dev/null || true
      sleep 2
      if [ -z "$(port_listener_pid "$current")" ]; then
        printf '%s\n' "$current"
        return 0
      fi
    fi
  done

  echo "ERROR: no available backup port for preferred port $preferred" >&2
  return 1
}

start_background() {
  local session_name="$1"
  local project_dir="$2"
  local command="$3"

  if command -v tmux >/dev/null 2>&1; then
    tmux has-session -t "$session_name" >/dev/null 2>&1 && tmux kill-session -t "$session_name" || true
    tmux new-session -d -s "$session_name" -c "$project_dir" /bin/zsh -lc "$command"
    echo "Started tmux session: $session_name"
    return 0
  fi

  /bin/zsh -lc "cd '$project_dir' && nohup /bin/zsh -lc \"$command\" >/dev/null 2>&1 &"
  echo "Started background process with nohup"
}
