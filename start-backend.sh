#!/bin/bash
cd "$(dirname "$0")"
export BACKEND_PORT=53429
export FRONTEND_PORT=43429
mkdir -p backend/data
exec npx tsx api/server.ts
