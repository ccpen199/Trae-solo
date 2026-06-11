#!/bin/zsh
set -e
cd /Users/chen/Documents/trae_projects/local_projects/may-89122
exec >> backend.log 2>&1
NODE24=/opt/homebrew/bin
export PATH="$NODE24:$PATH"
export HOST=127.0.0.1
export NODE_ENV=development
exec "$NODE24/node" --import tsx api/server.ts
