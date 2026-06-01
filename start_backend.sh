#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-63426
BACKEND_PORT=53426 nohup node backend/server.js > /tmp/backend_may63426.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID 2>/dev/null
echo "Started backend with PID $BACKEND_PID"
sleep 2
lsof -nP -iTCP:53426 -sTCP:LISTEN
