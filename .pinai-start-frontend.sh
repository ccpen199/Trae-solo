#!/bin/zsh
set -e
cd /Users/chen/Documents/trae_projects/local_projects/may-89122
exec >> frontend.log 2>&1
NODE24=/opt/homebrew/bin
export PATH="$NODE24:$PATH"
export HOST=127.0.0.1
export NODE_ENV=development
exec "$NODE24/node" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 49122 --strictPort
