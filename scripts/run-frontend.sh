#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
FRONTEND_LOG="$PROJECT_DIR/frontend.log"

set -a
source "$ENV_FILE"
set +a

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

cd "$PROJECT_DIR/frontend"
exec "$NODE_BIN" "$PROJECT_DIR/frontend/node_modules/vite/bin/vite.js" --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort >> "$FRONTEND_LOG" 2>&1
