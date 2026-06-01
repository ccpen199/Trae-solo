#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-86782/frontend
nohup npm run dev -- --host 127.0.0.1 < /dev/null > ../frontend.log 2>&1 &
echo $!
