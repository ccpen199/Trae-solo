#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-989/backend
nohup node server.js > /Users/chen/Documents/trae_projects/local_projects/may-989/backend.log 2>&1 &
echo $! > /Users/chen/Documents/trae_projects/local_projects/may-989/backend.pid
echo "后端已启动，PID: $(cat /Users/chen/Documents/trae_projects/local_projects/may-989/backend.pid)"
