#!/usr/bin/env python3
import os, subprocess, sys, time, signal

PROJECT = '/Users/chen/Documents/trae_projects/local_projects/may-89014'
DEVNULL = open(os.devnull, 'w')

def kill_pid(pid):
    try:
        cmdline = ''
        try:
            cmdline = open(f'/proc/{pid}/cmdline').read().replace('\x00', ' ')
        except:
            try:
                cmdline = subprocess.check_output(['ps', '-p', str(pid), '-o', 'cmd='], text=True).strip()
            except:
                pass
        cwd = ''
        try:
            cwd = os.readlink(f'/proc/{pid}/cwd')
        except:
            pass
        if ('may-89014' in cwd or 'may-89014' in cmdline or 'vite' in cmdline or 'src/index.js' in cmdline):
            try:
                os.kill(pid, signal.SIGKILL)
                print(f'Killed {pid}: {cmdline[:80]}')
                return True
            except:
                return False
    except:
        pass
    return False

# Kill existing processes
try:
    for port in [49015, 59015, 49014, 59014]:
        out = subprocess.check_output(['lsof', '-nP', f'-iTCP:{port}', '-sTCP:LISTEN', '-F', 'pc'], text=True)
        for line in out.strip().split('\n'):
            if line.startswith('p'):
                kill_pid(int(line[1:]))
except Exception as e:
    pass

time.sleep(2)

# Remove database files to ensure clean seed
for d in ['backend/data', 'data']:
    for f in ['app.sqlite', 'app.sqlite-wal', 'app.sqlite-shm']:
        p = os.path.join(PROJECT, d, f)
        try:
            if os.path.exists(p):
                os.remove(p)
        except:
            pass

# Remove logs
for f in ['backend.log', 'frontend.log']:
    p = os.path.join(PROJECT, f)
    try:
        if os.path.exists(p):
            os.remove(p)
    except:
        pass

# Start backend
os.chdir(os.path.join(PROJECT, 'backend'))
backend_log = open(os.path.join(PROJECT, 'backend.log'), 'w')
backend = subprocess.Popen(
    ['node', 'src/index.js'],
    stdin=DEVNULL,
    stdout=backend_log,
    stderr=backend_log,
    start_new_session=True
)
print(f'Backend: PID={backend.pid}')

time.sleep(3)

# Start frontend
os.chdir(os.path.join(PROJECT, 'frontend'))
frontend_log = open(os.path.join(PROJECT, 'frontend.log'), 'w')
frontend = subprocess.Popen(
    ['node', 'node_modules/vite/bin/vite.js'],
    stdin=DEVNULL,
    stdout=frontend_log,
    stderr=frontend_log,
    start_new_session=True
)
print(f'Frontend: PID={frontend.pid}')

time.sleep(10)

# Verify ports
for port in [59015, 49015]:
    r = subprocess.run(
        ['lsof', '-nP', f'-iTCP:{port}', '-sTCP:LISTEN'],
        capture_output=True, text=True
    )
    status = 'OK' if r.stdout.strip() else 'FAIL'
    print(f'Port {port}: {status}')

DEVNULL.close()
