#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89115"
cd "$PROJECT_DIR"

set -a
source "$PROJECT_DIR/.env"
set +a

export HOST="${HOST:-127.0.0.1}"
export BACKEND_PORT="${BACKEND_PORT:-59115}"
export PORT="$BACKEND_PORT"
export DB_PATH="${DB_PATH:-data/app.sqlite}"

echo $$ > "$PROJECT_DIR/backend.pid"
exec /opt/homebrew/bin/node backend/server.js >> "$PROJECT_DIR/backend.log" 2>&1
