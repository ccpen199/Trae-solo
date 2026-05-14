#!/bin/bash

cd "$(dirname "$0")/src/routes"

for file in *.js; do
    # 替换 db.prepare 调用为 await db.prepare
    # 替换 (req, res) => { 为 async (req, res) => {
    sed -i "" 's/router\.\(get\|post\|put\|delete\)("\([^"]*\)",\(.*\)(req, res) => {/router.\1("\2",\3async (req, res) => {/g' "$file"
    sed -i "" 's/db\.prepare\(\.all\|\.get\|\.run\)/await db.prepare\1/g' "$file"
    sed -i "" 's/db\.\(all\|get\|run\|exec\)/await db.\1/g' "$file"
done

echo "Updated all route files"
