#!/bin/bash
cd "$(dirname "$0")/backend"
exec npx tsx src/index.ts
