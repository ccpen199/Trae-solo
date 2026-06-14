#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Current directory: $(pwd)"
echo "Package.json exists: $(test -f package.json && echo yes || echo no)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "--- Running npm install ---"
npm install --no-audit --no-fund 2>&1
echo "--- npm install exit code: $? ---"
echo "node_modules exists: $(test -d node_modules && echo yes || echo no)"
ls -la node_modules 2>&1 | head -5
