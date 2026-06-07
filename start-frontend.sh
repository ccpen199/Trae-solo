#!/bin/bash
cd "$(dirname "$0")/frontend"
nohup npx vite --host 127.0.0.1 --port 48940 --strictPort > ../frontend.log 2>&1 &
echo $! > ../frontend.pid
echo "Frontend started with PID $(cat ../frontend.pid)"
