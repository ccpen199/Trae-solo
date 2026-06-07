#!/bin/zsh
set -e

cd "$(dirname "$0")"
source .env

PROJECT_DIR="$(pwd)"
NODE22_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
  NODE_BIN="$NODE22_BIN/node"
else
  NODE_BIN="$(command -v node)"
fi

FRONTEND_PORT="${FRONTEND_PORT:-49058}"
export FRONTEND_PORT
export NODE_BIN

pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$pid" ]; then
  cwd=$(lsof -p "$pid" -d cwd -a 2>/dev/null | awk 'NR==2 {print $NF}')
  case "$cwd" in
    "$PROJECT_DIR"*) kill "$pid" 2>/dev/null || true ;;
    *) echo "skip frontend: port $FRONTEND_PORT is occupied by cwd=$cwd"; exit 1 ;;
  esac
fi

sleep 1
"$NODE_BIN" - <<'NODE'
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const projectDir = process.cwd()
const nodeBin = process.env.NODE_BIN
const frontendPort = process.env.FRONTEND_PORT || '49058'
const log = fs.openSync(path.join(projectDir, 'frontend.log'), 'w')
const child = spawn(nodeBin, [
  './node_modules/vite/bin/vite.js',
  '--host',
  '127.0.0.1',
  '--port',
  frontendPort,
  '--strictPort',
], {
  cwd: projectDir,
  detached: true,
  env: {
    ...process.env,
    PATH: `/Users/chen/.nvm/versions/node/v22.22.0/bin:${process.env.PATH}`,
    FRONTEND_PORT: frontendPort,
  },
  stdio: ['ignore', log, log],
})
fs.writeFileSync(path.join(projectDir, 'frontend.pid'), String(child.pid))
child.unref()
NODE

listen_pid=""
for _ in {1..10}; do
  listen_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  [ -n "$listen_pid" ] && break
  sleep 1
done
if [ -z "$listen_pid" ]; then
  echo "frontend failed to listen on $FRONTEND_PORT; see frontend.log"
  exit 1
fi
echo "$listen_pid" > frontend.pid
echo "Frontend started, PID=$listen_pid, PORT=$FRONTEND_PORT"
