#!/bin/bash
cd "$(dirname "$0")"

echo "Starting backend server..."
echo "Port: 53378"

while true; do
  node src/server.js
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE. Restarting in 2 seconds..."
  sleep 2
done
