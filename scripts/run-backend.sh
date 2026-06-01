#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

cd "$PROJECT_DIR/backend"
NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  if [ -x "$HOME/.nvm/versions/node/v22.22.0/bin/node" ]; then
    NODE_BIN="$HOME/.nvm/versions/node/v22.22.0/bin/node"
  else
    NODE_BIN="$(command -v node)"
  fi
fi
exec "$NODE_BIN" src/index.js
