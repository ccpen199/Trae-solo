#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-63488/frontend
nohup npx vite < /dev/null > ../frontend.log 2>&1 &
echo $!
