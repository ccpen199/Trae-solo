#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-86782/backend
nohup npm start < /dev/null > ../backend.log 2>&1 &
echo $!
