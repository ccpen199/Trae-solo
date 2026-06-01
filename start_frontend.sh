#!/bin/bash
cd "$(dirname "$0")/frontend"
nohup npm run dev > ../frontend.log 2>&1 &
echo $! > ../frontend.pid
