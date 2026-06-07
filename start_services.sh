#!/bin/zsh
cd /Users/chen/Documents/trae_projects/local_projects/may-89057
rm -f backend.log frontend.log
echo "Starting backend..."
setsid nohup npm run server:dev > backend.log 2>&1 < /dev/null &
echo "Backend started, PID: $!"
sleep 3
echo "Starting frontend..."
setsid nohup npm run client:dev > frontend.log 2>&1 < /dev/null &
echo "Frontend started, PID: $!"
echo "Waiting 10 seconds for services to initialize..."
sleep 10
echo "Done!"
