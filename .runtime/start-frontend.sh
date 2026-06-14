#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89115"
FRONTEND_DIR="$PROJECT_DIR/hangzhou-citizen-platform"
cd "$FRONTEND_DIR"

set -a
source "$PROJECT_DIR/.env"
set +a

export HOST="${HOST:-127.0.0.1}"
export FRONTEND_PORT="${FRONTEND_PORT:-49115}"
export BACKEND_PORT="${BACKEND_PORT:-59115}"
export VITE_API_URL="${VITE_API_URL:-http://127.0.0.1:59115/api}"

echo $$ > "$PROJECT_DIR/frontend.pid"
exec /opt/homebrew/bin/node ./node_modules/vite/bin/vite.js --host "$HOST" --port "$FRONTEND_PORT" --strictPort >> "$PROJECT_DIR/frontend.log" 2>&1
