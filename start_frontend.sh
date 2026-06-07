#!/bin/bash
cd "$(dirname "$0")"
cd frontend
exec node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 49022 --strictPort
