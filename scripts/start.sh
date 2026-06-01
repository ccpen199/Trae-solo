#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
source ./.env
set +a

mkdir -p data

python3 scripts/launch.py backend backend.pid backend.log python3 backend/server.py
python3 scripts/launch.py frontend frontend.pid frontend.log python3 frontend/server.py
