#!/bin/zsh
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89092"
NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"

if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

cd "$PROJECT_DIR/backend"
exec "$NODE_BIN" --env-file=../.env src/index.js
