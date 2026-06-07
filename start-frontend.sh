#!/bin/bash
cd "$(dirname "$0")/frontend"
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 49013 --strictPort > ../frontend.log 2>&1 &
disown
echo $! > ../frontend.pid
echo "Frontend started, PID: $(cat ../frontend.pid)"
