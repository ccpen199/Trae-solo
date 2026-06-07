#!/bin/bash
cd "$(dirname "$0")/backend"
node src/index.js > ../backend.log 2>&1 &
echo $! > ../backend.pid
echo "Backend started, PID: $(cat ../backend.pid)"
