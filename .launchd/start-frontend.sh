#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89105"
cd "$PROJECT_DIR"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
set -a
source "$PROJECT_DIR/.env"
set +a

export NODE_ENV="${NODE_ENV:-development}"
export HOST="${HOST:-127.0.0.1}"
export FRONTEND_PORT="${FRONTEND_PORT:-50105}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-${VITE_API_URL:-http://127.0.0.1:59105/api}}"

exec /opt/homebrew/bin/npm run client:dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
