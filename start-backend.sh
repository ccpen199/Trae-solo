#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/chen/.nvm/versions/node/v22.22.0/bin:$PATH"
set -a
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
set +a

ENV_FILE="$ROOT/.env"
BASE_PORT="${BACKEND_PORT:-58783}"
PORT="$BASE_PORT"

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp_file

  touch "$ENV_FILE"
  tmp_file="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    $0 ~ "^" key "=" {
      print key "=" value
      updated = 1
      next
    }
    { print }
    END {
      if (!updated) print key "=" value
    }
  ' "$ENV_FILE" > "$tmp_file"
  mv "$tmp_file" "$ENV_FILE"
  export "$key=$value"
}

health_url_for_port() {
  echo "http://127.0.0.1:$1/api/health"
}

existing_pid_for_port() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n 1
}

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

wait_for_port_release() {
  local port="$1"
  local attempt
  for attempt in $(seq 1 20); do
    if [ -z "$(existing_pid_for_port "$port")" ]; then
      return 0
    fi
    sleep 0.25
  done
  return 1
}

choose_backend_port() {
  local offset
  local candidate
  local pid
  local cwd
  local health_url

  for offset in $(seq 0 6); do
    candidate=$((BASE_PORT + offset * 1000))
    if [ "$candidate" -gt 65535 ]; then
      continue
    fi

    pid="$(existing_pid_for_port "$candidate")"
    health_url="$(health_url_for_port "$candidate")"
    if [ -z "$pid" ]; then
      PORT="$candidate"
      return 0
    fi

    cwd="$(pid_cwd "$pid")"
    if [ "$cwd" = "$ROOT/backend" ]; then
      if curl -fsS --max-time 2 "$health_url" >/dev/null 2>&1; then
        PORT="$candidate"
        if [ "$PORT" != "$BASE_PORT" ]; then
          set_env_value BACKEND_PORT "$PORT"
          set_env_value API_BASE_URL "http://127.0.0.1:${PORT}"
          echo "Using backend backup port ${PORT}; .env updated"
        fi
        echo "$pid" > "$ROOT/backend.pid"
        echo "Backend already running on http://127.0.0.1:${PORT} (pid ${pid})"
        exit 0
      fi

      echo "Backend pid ${pid} is unhealthy on ${health_url}; restarting this project process" >&2
      kill "$pid" 2>/dev/null || true
      if wait_for_port_release "$candidate"; then
        PORT="$candidate"
        return 0
      fi
      echo "Port ${candidate} did not release after stopping pid ${pid}" >&2
      continue
    fi

    echo "Backend port ${candidate} is occupied by pid ${pid} outside this project: ${cwd:-unknown cwd}; trying backup slot" >&2
  done

  echo "No available backend port found from ${BASE_PORT} backup slots" >&2
  return 1
}

choose_backend_port
if [ "$PORT" != "$BASE_PORT" ]; then
  set_env_value BACKEND_PORT "$PORT"
  set_env_value API_BASE_URL "http://127.0.0.1:${PORT}"
  echo "Using backend backup port ${PORT}; .env updated"
fi

cd "$ROOT/backend"

NODE_CANDIDATES=()
[ -n "$NODE_BIN" ] && NODE_CANDIDATES+=("$NODE_BIN")
NODE_CANDIDATES+=("node")
[ -x "/Users/chen/.nvm/versions/node/v22.22.0/bin/node" ] && NODE_CANDIDATES+=("/Users/chen/.nvm/versions/node/v22.22.0/bin/node")

for NODE_CANDIDATE in "${NODE_CANDIDATES[@]}"; do
  if "$NODE_CANDIDATE" -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); db.close();" >/dev/null 2>&1; then
    echo "$$" > "$ROOT/backend.pid"
    exec "$NODE_CANDIDATE" server.js
  fi
done

echo "No compatible Node runtime found for better-sqlite3" >&2
exit 1
