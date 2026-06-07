#!/bin/bash
cd "$(dirname "$0")/frontend"
exec node node_modules/.bin/vite --port 48989 --strictPort --host 127.0.0.1
