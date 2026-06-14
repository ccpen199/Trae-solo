#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-89151/backend
exec npx ts-node-dev --respawn --transpile-only src/index.ts < /dev/null
