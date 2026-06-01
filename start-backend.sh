#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-63488/backend
nohup node src/server.js < /dev/null > ../backend.log 2>&1 &
echo $!
