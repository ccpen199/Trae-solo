#!/bin/zsh
cd /Users/chen/Documents/trae_projects/local_projects/may-68830/frontend
export FRONTEND_PORT=48830
export BACKEND_PORT=58830
npx vite --host 127.0.0.1 --port 48830 --strictPort < /dev/null > /dev/null 2>&1 &
echo $!
