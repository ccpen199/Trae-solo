import subprocess
res = subprocess.run(
    ['npx','tsc','--noEmit'],
    cwd='/Users/chen/Documents/trae_projects/local_projects/may-89212/frontend-user',
    capture_output=True, text=True, timeout=180
)
errors = res.stdout + res.stderr
with open('/tmp/ts_all.txt', 'w') as f:
    f.write(errors)

home_errs = [l for l in errors.split('\n') if 'Home.tsx' in l]
lines = []
for l in home_errs:
    parts = l.split(':')
    if len(parts) >= 2 and parts[1].isdigit():
        lines.append(int(parts[1]))
lines = sorted(set(lines))
print("Home错误数:", len(home_errs), " 行数:", len(lines))
if lines:
    print("错误段: %d-%d" % (lines[0], lines[-1]))
    print("错误行号列表(前15):", lines[:15])
for l in home_errs[:3]:
    print("  例:", l[:220])

other_errs = {}
for l in errors.split('\n'):
    if '.tsx:' in l or '.ts:' in l:
        name = l.split(':')[0]
        if 'Home' not in name:
            other_errs[name] = other_errs.get(name,0)+1
print("\n其他页面:", other_errs)
