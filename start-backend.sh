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

BACKEND_PORT="${BACKEND_PORT:-59058}"
export BACKEND_PORT
export NODE_BIN
export NODE_ENV=development

pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$pid" ]; then
  cwd=$(lsof -p "$pid" -d cwd -a 2>/dev/null | awk 'NR==2 {print $NF}')
  ppid=$(ps -o ppid= -p "$pid" 2>/dev/null | xargs || true)
  case "$cwd" in
    "$PROJECT_DIR"*)
      kill "$pid" 2>/dev/null || true
      if [ -n "$ppid" ]; then
        pcwd=$(lsof -p "$ppid" -d cwd -a 2>/dev/null | awk 'NR==2 {print $NF}')
        case "$pcwd" in
          "$PROJECT_DIR"*) kill "$ppid" 2>/dev/null || true ;;
        esac
      fi
      ;;
    *) echo "skip backend: port $BACKEND_PORT is occupied by cwd=$cwd"; exit 1 ;;
  esac
fi

sleep 1
"$NODE_BIN" - <<'NODE'
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { spawn } = require('child_process')

const projectDir = process.cwd()
const nodeBin = process.env.NODE_BIN
const log = fs.openSync(path.join(projectDir, 'backend.log'), 'w')
const child = spawn(nodeBin, [
  '--require',
  path.join(projectDir, 'node_modules/tsx/dist/preflight.cjs'),
  '--import',
  pathToFileURL(path.join(projectDir, 'node_modules/tsx/dist/loader.mjs')).href,
  'api/server.ts',
], {
  cwd: projectDir,
  detached: true,
  env: {
    ...process.env,
    PATH: `/Users/chen/.nvm/versions/node/v22.22.0/bin:${process.env.PATH}`,
    NODE_ENV: 'development',
    BACKEND_PORT: process.env.BACKEND_PORT || '59058',
  },
  stdio: ['ignore', log, log],
})
fs.writeFileSync(path.join(projectDir, 'backend.pid'), String(child.pid))
child.unref()
NODE

listen_pid=""
for _ in {1..10}; do
  listen_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  [ -n "$listen_pid" ] && break
  sleep 1
done
if [ -z "$listen_pid" ]; then
  echo "backend failed to listen on $BACKEND_PORT; see backend.log"
  exit 1
fi
echo "$listen_pid" > backend.pid
echo "Backend started, PID=$listen_pid, PORT=$BACKEND_PORT"
