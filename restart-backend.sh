#!/bin/bash
PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89061"
PORT=59061

cd "$PROJECT_DIR"

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
echo "Current backend PID: $pid"

if [ -n "$pid" ]; then
  cwd=$(lsof -p $pid | grep cwd | awk '{print $9}')
  cmd=$(ps -o command= -p $pid)
  echo "CWD: $cwd"
  echo "CMD: $cmd"

  if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
    echo "Killing PID $pid (belongs to this project)"
    kill $pid
    sleep 2
  else
    echo "SKIP: cwd=$cwd does not belong to $PROJECT_DIR"
    exit 1
  fi
fi

echo "Starting backend..."
nohup node backend/src/server.js > backend.log 2>&1 &
echo "New backend started, PID: $!"
sleep 3
