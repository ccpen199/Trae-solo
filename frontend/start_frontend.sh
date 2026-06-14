#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-89072/frontend
rm -f frontend.log
nohup npx vite --host 127.0.0.1 --port 49072 --strictPort > frontend.log 2>&1 &
disown
sleep 3
cat frontend.log
