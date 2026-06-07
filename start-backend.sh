#!/bin/bash
cd "$(dirname "$0")/backend"
nohup npm run dev > ../backend.log 2>&1 &
echo "Backend started, PID: $!"
