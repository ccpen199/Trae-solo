#!/bin/bash
cd "$(dirname "$0")/backend"
NODE_PATH="/Users/chen/.nvm/versions/node/v22.22.0/bin"
export PATH="$NODE_PATH:$PATH"
"$NODE_PATH/node" -v > ../backend.log 2>&1
nohup "$NODE_PATH/npx" tsx watch src/index.ts >> ../backend.log 2>&1 &
echo $! > ../backend.pid
echo "Backend started with PID $(cat ../backend.pid)"
