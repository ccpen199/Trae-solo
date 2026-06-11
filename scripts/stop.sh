#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"

for session in "pinai_${PROJECT_NAME}_frontend" "pinai_${PROJECT_NAME}_backend"; do
  if "$TMUX_BIN" has-session -t "$session" >/dev/null 2>&1; then
    "$TMUX_BIN" kill-session -t "$session"
    echo "stopped $session"
  fi
done
