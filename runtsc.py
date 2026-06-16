#!/usr/bin/env python3
import subprocess
import os

os.chdir('/Users/chen/Documents/trae_projects/local_projects/may-89212/frontend-user')
import shutil
npx = shutil.which('npx')
print('npx:', npx)
import sys
p = subprocess.run(
    [npx, 'tsc', '-b', '--clean'],
    stdout=sys.stdout, stderr=sys.stderr, timeout=120,
    env={**os.environ, 'PATH': f"/usr/local/bin:/opt/homebrew/bin:{os.environ.get('PATH','')}"}
)
print('clean exit', p.returncode)
p = subprocess.run(
    [npx, 'tsc', '--noEmit'],
    capture_output=True, text=True, timeout=300,
    env={**os.environ, 'PATH': f"/usr/local/bin:/opt/homebrew/bin:{os.environ.get('PATH','')}"}
)
out = p.stdout + '\n' + p.stderr
with open('/tmp/tsc_output.txt', 'w') as f:
    f.write(out)
home_errs = [l for l in out.split('\n') if 'Home.tsx' in l]
other_errs = {}
for l in out.split('\n'):
    if ('error TS' in l or '错误 TS' in l) and ('.tsx:' in l or '.ts:' in l):
        name = l.split(':')[0]
        other_errs[name] = other_errs.get(name,0)+1
print()
print('Home错误数:', len(home_errs))
print('其他页面错误:', other_errs)
print('exit code:', p.returncode)
if len(home_errs):
    print('前3个Home错误:')
    for l in home_errs[:3]:
        print(' ', l[:200])
