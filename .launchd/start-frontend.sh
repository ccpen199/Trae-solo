#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89135"
cd "$PROJECT_DIR"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
set -a
source "$PROJECT_DIR/.env"
set +a

export HOST="${HOST:-127.0.0.1}"
export FRONTEND_PORT="${FRONTEND_PORT:-49135}"
export BACKEND_PORT="${BACKEND_PORT:-59135}"

exec "$PROJECT_DIR/node_modules/.bin/vite" --host "$HOST" --port "$FRONTEND_PORT" --strictPort
