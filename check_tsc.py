#!/usr/bin/env python3
import subprocess, shutil, os
os.chdir('/Users/chen/Documents/trae_projects/local_projects/may-89212/frontend-user')
npx = shutil.which('npx')
p = subprocess.run(
    [npx, 'tsc', '--noEmit'],
    capture_output=True, text=True, timeout=300
)
out = (p.stdout + '\n' + p.stderr).strip()
err_lines = [l for l in out.split('\n') if ('error TS' in l or '错误 TS' in l)]
print('总错误数:', len(err_lines))
pages = {}
for l in err_lines:
    name = l.split(':')[0] if ':' in l else 'unknown'
    pages[name] = pages.get(name,0)+1
print('按页面:', pages)
print('exit code:', p.returncode)
if err_lines:
    print('前5:')
    for l in err_lines[:5]:
        print(' ', l[:200])
else:
    print('✅ 全部通过,0错误!')
