#!/bin/bash
cd "$(dirname "$0")"
nohup node server.js > ../backend.log 2>&1 &
echo "Backend started: $!"
