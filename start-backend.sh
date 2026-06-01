#!/bin/zsh
cd /Users/chen/Documents/trae_projects/local_projects/may-68830/backend
node src/server.js < /dev/null > /dev/null 2>&1 &
echo $!
