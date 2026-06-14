#!/bin/zsh
cd "$(dirname "$0")"
npx vite --strictPort --host 127.0.0.1 --port 49073 > frontend.log 2>&1 < /dev/null
