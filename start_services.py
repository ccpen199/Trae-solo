#!/usr/bin/env python3
import os, subprocess, time, sys

PROJECT = '/Users/chen/Documents/trae_projects/local_projects/may-89014'
NODE_22 = '/Users/chen/.nvm/versions/node/v22.22.0/bin/node'
NODE_BIN = NODE_22 if os.path.exists(NODE_22) else 'node'

env = os.environ.copy()
env_path = os.path.join(PROJECT, '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            env[key] = value

frontend_port = env.get('FRONTEND_PORT', '49014')
backend_port = env.get('BACKEND_PORT', '59014')

os.chdir(os.path.join(PROJECT, 'backend'))
backend = subprocess.Popen([NODE_BIN, 'src/index.js'], stdout=open(os.path.join(PROJECT, 'backend.log'), 'a'), stderr=subprocess.STDOUT, env=env)
print(f'Backend started: PID={backend.pid}')

os.chdir(os.path.join(PROJECT, 'frontend'))
frontend = subprocess.Popen([NODE_BIN, 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', frontend_port, '--strictPort'], stdout=open(os.path.join(PROJECT, 'frontend.log'), 'a'), stderr=subprocess.STDOUT, env=env)
print(f'Frontend started: PID={frontend.pid}')

time.sleep(8)

for port in [backend_port, frontend_port]:
    r = subprocess.run(['lsof', '-nP', f'-iTCP:{port}', '-sTCP:LISTEN'], capture_output=True, text=True)
    print(f'Port {port}:', 'OK' if r.stdout.strip() else 'FAIL')

sys.exit(0)
