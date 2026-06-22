#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-89303
LOG_FILE="/tmp/vite_server_$(date +%Y%m%d_%H%M%S).log"
echo "Starting Vite dev server..." > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
nohup node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5176 < /dev/null >> "$LOG_FILE" 2>&1 &
VITE_PID=$!
echo "Vite PID: $VITE_PID" >> "$LOG_FILE"
echo "Log file: $LOG_FILE"
disown $VITE_PID
sleep 5
echo "=== Server started ==="
echo "PID: $VITE_PID"
cat "$LOG_FILE"
