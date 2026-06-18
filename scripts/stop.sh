#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

USER_DOMAIN="gui/$(id -u)"

stop_label() {
  local label="$1"
  if launchctl print "${USER_DOMAIN}/${label}" >/dev/null 2>&1; then
    launchctl bootout "${USER_DOMAIN}/${label}" >/dev/null 2>&1 || true
  fi
}

stop_pid() {
  local name="$1"
  local pid_file=".runtime/${name}.pid"
  [[ -f "$pid_file" ]] || return 0
  local pid
  pid="$(cat "$pid_file")"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    local cwd
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^n/ { sub(/^n/, ""); print; exit }')"
    if [[ "$cwd" == "$ROOT"* ]]; then
      kill "$pid"
    fi
  fi
  rm -f "$pid_file"
}

stop_label local.pinai.may-89137.frontend
stop_label local.pinai.may-89137.backend
stop_pid frontend
stop_pid backend
