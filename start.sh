#!/bin/bash
cd "$(dirname "$0")"
echo "Installing dependencies..."
npm install
echo "Starting development servers..."
npm run dev
