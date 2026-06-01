#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

cd "$PROJECT_DIR/frontend"
NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  if [ -x "$HOME/.nvm/versions/node/v22.22.0/bin/node" ]; then
    NODE_BIN="$HOME/.nvm/versions/node/v22.22.0/bin/node"
  else
    NODE_BIN="$(command -v node)"
  fi
fi
exec "$NODE_BIN" "$PROJECT_DIR/frontend/node_modules/vite/bin/vite.js" --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
