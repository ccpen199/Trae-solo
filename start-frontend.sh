#!/bin/bash
cd "$(dirname "$0")"
exec npx vite --host 127.0.0.1 --port 43429 --strictPort
