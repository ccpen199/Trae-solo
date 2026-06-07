#!/bin/bash
cd "$(dirname "$0")"
nohup node serve.js > ../frontend.log 2>&1 &
echo "Frontend started: $!"
