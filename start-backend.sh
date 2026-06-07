#!/bin/bash
set -e

cd "$(dirname "$0")"

PORT=59052
PROJECT_DIR="$(pwd)"

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$pid" ]; then
  cwd=$(lsof -p "$pid" 2>/dev/null | grep cwd | awk '{print $9}' | xargs)
  if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
    echo "Killing old backend PID $pid"
    kill -9 "$pid"
    sleep 1
  fi
fi

for pid in $(pgrep -f "tsx.*api/server\|nodemon" 2>/dev/null); do
  cwd=$(lsof -p "$pid" 2>/dev/null | grep cwd | awk '{print $9}' | xargs)
  if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
    echo "Killing related process $pid"
    kill -9 "$pid" 2>/dev/null
  fi
done

sleep 1
echo "Starting backend..."
NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"
nohup $NODE_BIN --import tsx/esm api/server.ts > backend.log 2>&1 </dev/null &
disown
PID=$!
echo "Backend started with PID $PID"
