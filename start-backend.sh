#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/Users/chen/.nvm/versions/node/v22.22.0/bin:$PATH"
set -a
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
set +a

cd "$ROOT/backend"

NODE_CANDIDATES=()
[ -n "$NODE_BIN" ] && NODE_CANDIDATES+=("$NODE_BIN")
NODE_CANDIDATES+=("node")
[ -x "/Users/chen/.nvm/versions/node/v22.22.0/bin/node" ] && NODE_CANDIDATES+=("/Users/chen/.nvm/versions/node/v22.22.0/bin/node")

for NODE_CANDIDATE in "${NODE_CANDIDATES[@]}"; do
  if "$NODE_CANDIDATE" -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); db.close();" >/dev/null 2>&1; then
    exec "$NODE_CANDIDATE" src/index.js
  fi
done

echo "No compatible Node runtime found for better-sqlite3" >&2
exit 1
