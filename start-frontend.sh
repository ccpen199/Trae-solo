#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"
PYTHON_BIN="${PYTHON_BIN:-python3}"
"$PYTHON_BIN" - "$NODE_BIN" "$ROOT_DIR/frontend" "$ROOT_DIR/frontend.log" "$ROOT_DIR/frontend.pid" ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 49042 --strictPort <<'PY'
import os
import sys

node_bin, workdir, log_path, pid_path, *node_args = sys.argv[1:]
pid = os.fork()
if pid:
    with open(pid_path, 'w') as f:
        f.write(str(pid))
    print(f"Frontend started, PID: {pid}")
    sys.exit(0)

os.setsid()
os.chdir(workdir)
fd = os.open(log_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.dup2(fd, 1)
os.dup2(fd, 2)
os.close(fd)
os.execv(node_bin, [node_bin] + node_args)
PY
