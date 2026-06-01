#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
LAUNCH_DOMAIN="gui/$(id -u)"
BACKEND_LABEL="local.codex.may-63450.backend.run"
FRONTEND_LABEL="local.codex.may-63450.frontend.run"

set -a
source "$PROJECT_DIR/.env"
set +a

NODE_BIN="${NODE_BIN:-$(command -v node)}"
if [[ -x "$HOME/.nvm/versions/node/v22.22.0/bin/node" ]]; then
  NODE_BIN="$HOME/.nvm/versions/node/v22.22.0/bin/node"
fi

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'
}

pid_in_project() {
  local cwd
  cwd="$(pid_cwd "$1")"
  [[ -n "$cwd" && "$cwd" == "$PROJECT_DIR"* ]]
}

stop_project_pid() {
  local pid="$1"
  if kill -0 "$pid" 2>/dev/null && pid_in_project "$pid"; then
    kill "$pid" 2>/dev/null || true
  fi
}

wait_port_free() {
  local port="$1"
  for _ in {1..40}; do
    if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  return 1
}

bootout_label() {
  local label="$1"
  launchctl remove "$label" >/dev/null 2>&1 || true
  launchctl bootout "$LAUNCH_DOMAIN/$label" >/dev/null 2>&1 || true
}

cleanup_legacy_labels() {
  for label in local.codex.may-63450.backend local.codex.may-63450.frontend local.codex.may-63450.backend2 local.codex.may-63450.frontend2 local.may-63450.backend local.may-63450.frontend; do
    bootout_label "$label"
  done
}

write_plist() {
  local label="$1"
  local workdir="$2"
  local stdout_log="$3"
  local stderr_log="$4"
  local plist_path="$5"
  shift 5

  {
    cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$label</string>
  <key>WorkingDirectory</key>
  <string>$workdir</string>
  <key>ProgramArguments</key>
  <array>
EOF
    for arg in "$@"; do
      printf '    <string>%s</string>\n' "$arg"
    done
    cat <<EOF
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$stdout_log</string>
  <key>StandardErrorPath</key>
  <string>$stderr_log</string>
</dict>
</plist>
EOF
  } > "$plist_path"
}

start_launchd_service() {
  local label="$1"
  local plist_path="$2"

  bootout_label "$label"
  launchctl bootstrap "$LAUNCH_DOMAIN" "$plist_path"
  launchctl kickstart -k "$LAUNCH_DOMAIN/$label" >/dev/null 2>&1 || true
}

build_launch_command() {
  local workdir="$1"
  shift

  printf 'cd %q && exec' "$workdir"
  for arg in "$@"; do
    printf ' %q' "$arg"
  done
}

start_launchd_command() {
  local label="$1"
  local log_path="$2"
  local command="$3"

  bootout_label "$label"
  launchctl submit -l "$label" -o "$log_path" -e "$log_path" -- /bin/bash -lc "$command"
}

write_port_pid() {
  local port="$1"
  local pid_file="$2"
  local pid
  for _ in {1..40}; do
    pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
    if [[ -n "$pid" ]] && pid_in_project "$pid"; then
      echo "$pid" > "$pid_file"
      return 0
    fi
    sleep 0.25
  done
  return 1
}

resolve_port() {
  local var_name="$1"
  local port="$2"
  local pid

  for _ in {1..8}; do
    local foreign_owner=0
    for pid in $(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null); do
      if pid_in_project "$pid"; then
        stop_project_pid "$pid"
      else
        foreign_owner=1
      fi
    done

    if [[ "$foreign_owner" == "0" ]] && wait_port_free "$port"; then
      echo "$port"
      return 0
    fi

    port=$((port + 1000))
  done

  echo "No free port found for $var_name" >&2
  return 1
}

write_env_value() {
  local key="$1"
  local value="$2"
  local tmp_file
  tmp_file="$(mktemp "$PROJECT_DIR/.env.XXXXXX")"
  if grep -q "^$key=" "$PROJECT_DIR/.env"; then
    awk -v key="$key" -v value="$value" '
      BEGIN { replaced = 0 }
      $0 ~ "^" key "=" {
        print key "=" value
        replaced = 1
        next
      }
      { print }
      END {
        if (!replaced) print key "=" value
      }
    ' "$PROJECT_DIR/.env" > "$tmp_file"
    mv "$tmp_file" "$PROJECT_DIR/.env"
  else
    printf '%s=%s\n' "$key" "$value" >> "$PROJECT_DIR/.env"
    rm -f "$tmp_file"
  fi
}

if [[ -f backend.pid ]]; then
  stop_project_pid "$(cat backend.pid)"
fi
if [[ -f frontend.pid ]]; then
  stop_project_pid "$(cat frontend.pid)"
fi
bootout_label "$BACKEND_LABEL"
bootout_label "$FRONTEND_LABEL"
cleanup_legacy_labels

FRONTEND_PORT="$(resolve_port FRONTEND_PORT "${FRONTEND_PORT:-43450}")"
BACKEND_PORT="$(resolve_port BACKEND_PORT "${BACKEND_PORT:-53450}")"
write_env_value FRONTEND_PORT "$FRONTEND_PORT"
write_env_value BACKEND_PORT "$BACKEND_PORT"
write_env_value API_BASE_URL "http://127.0.0.1:$BACKEND_PORT/api"
write_env_value VITE_API_BASE_URL "http://127.0.0.1:$BACKEND_PORT/api"
export FRONTEND_PORT BACKEND_PORT API_BASE_URL="http://127.0.0.1:$BACKEND_PORT/api" VITE_API_BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"

rm -f "$PROJECT_DIR/backend.log" "$PROJECT_DIR/frontend.log" "$PROJECT_DIR/frontend-build.log"

echo "Starting Charging Parking System..."
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port: $BACKEND_PORT"

BACKEND_COMMAND="$(build_launch_command "$PROJECT_DIR/backend" "$NODE_BIN" "src/server.js")"
start_launchd_command "$BACKEND_LABEL" "$PROJECT_DIR/backend.log" "$BACKEND_COMMAND"
write_port_pid "$BACKEND_PORT" "$PROJECT_DIR/backend.pid"

sleep 1

(
  cd "$PROJECT_DIR/frontend"
  if [[ ! -f dist/index.html || "${FORCE_FRONTEND_BUILD:-0}" == "1" ]]; then
    npm run build >> "$PROJECT_DIR/frontend-build.log" 2>&1
  else
    echo "Using existing frontend/dist build" >> "$PROJECT_DIR/frontend-build.log"
  fi
)
FRONTEND_COMMAND="$(build_launch_command "$PROJECT_DIR/frontend" "$NODE_BIN" "server.js")"
start_launchd_command "$FRONTEND_LABEL" "$PROJECT_DIR/frontend.log" "$FRONTEND_COMMAND"
write_port_pid "$FRONTEND_PORT" "$PROJECT_DIR/frontend.pid"

sleep 2

echo ""
echo "=== System Ready ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "Logs:"
echo "  tail -f backend.log"
echo "  tail -f frontend.log"
