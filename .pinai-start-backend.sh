#!/bin/zsh
set -e
cd /Users/chen/Documents/trae_projects/local_projects/may-89117
exec >> backend.log 2>&1
NODE22=/Users/chen/.nvm/versions/node/v22.22.0/bin
export PATH="$NODE22:$PATH"
export HOST=127.0.0.1
export NODE_ENV=development
exec "$NODE22/node" backend/server.js
