#!/usr/bin/env python3
import os
import subprocess
import sys

PROJECT_DIR = os.path.abspath(os.path.dirname(__file__))

# 检查node版本
result = subprocess.run(['node', '--version'], capture_output=True, text=True)
print(f"Node版本: {result.stdout.strip()}")

# 重新安装后端依赖
print("\n重新安装后端依赖...")
backend_dir = os.path.join(PROJECT_DIR, 'backend')
os.chdir(backend_dir)

# 清理旧的
for item in ['node_modules', 'package-lock.json']:
    path = os.path.join(backend_dir, item)
    if os.path.exists(path):
        if os.path.isdir(path):
            subprocess.run(['rm', '-rf', path])
        else:
            os.remove(path)

# 重新安装
result = subprocess.run(['npm', 'install'], capture_output=True, text=True)
if result.returncode != 0:
    print(f"npm install 失败: {result.stderr}")
    sys.exit(1)
print("npm install 成功")

# 检查better-sqlite3是否可以加载
print("\n测试better-sqlite3加载...")
test_code = '''
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'test.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)');
db.exec('INSERT INTO test VALUES (1)');
const row = db.prepare('SELECT * FROM test').get();
console.log('better-sqlite3 OK, got:', row);
db.close();
require('fs').unlinkSync(path.join(__dirname, '..', 'data', 'test.sqlite'));
'''
result = subprocess.run(['node', '-e', test_code], capture_output=True, text=True, cwd=backend_dir)
if result.returncode != 0:
    print(f"better-sqlite3 加载失败: {result.stderr}")
    sys.exit(1)
print(result.stdout.strip())

print("\n✅ 后端依赖安装完成")
