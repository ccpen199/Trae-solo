#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

cd "$PROJECT_DIR/frontend"
if [ -z "${NODE_BIN:-}" ] || [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi
exec "$NODE_BIN" "$PROJECT_DIR/frontend/node_modules/vite/bin/vite.js" --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
