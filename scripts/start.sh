#!/bin/bash
set -e

cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

source .env

NODE22_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

echo "=== Starting Parcel Platform ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo ""

echo "Starting backend (log: backend.log)..."
cd backend
nohup npm run start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

echo "Starting frontend (log: frontend.log)..."
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "Waiting 8 seconds for services to start..."
sleep 8

echo ""
./scripts/check.sh
