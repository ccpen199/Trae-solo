#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-89303
echo "Starting Vite dev server..." > /tmp/vite_debug.log
echo "Date: $(date)" >> /tmp/vite_debug.log
echo "Node version: $(node --version)" >> /tmp/vite_debug.log
echo "NPM version: $(npm --version)" >> /tmp/vite_debug.log
echo "---" >> /tmp/vite_debug.log

node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173 >> /tmp/vite_debug.log 2>&1 &
VITE_PID=$!
echo "Vite PID: $VITE_PID" >> /tmp/vite_debug.log

sleep 8

echo "---" >> /tmp/vite_debug.log
echo "Process status after 8 seconds:" >> /tmp/vite_debug.log
ps -p $VITE_PID >> /tmp/vite_debug.log 2>&1 || echo "Process not running" >> /tmp/vite_debug.log

echo "---" >> /tmp/vite_debug.log
echo "Log contents:" >> /tmp/vite_debug.log
cat /tmp/vite_debug.log

echo "---"
echo "Checking if port 5173 is listening..."
lsof -i :5173 2>&1 || echo "Port 5173 not in use"
