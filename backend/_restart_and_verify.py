import subprocess, time, urllib.request, json

PORT = 59214
# Check current PID
r = subprocess.run(['lsof', '-ti', f'tcp:{PORT}'], capture_output=True, text=True)
old_pid = r.stdout.strip()
print(f'Old PID: {old_pid}')
if old_pid:
    subprocess.run(['kill', old_pid])
    time.sleep(2)

# Start new backend
env = {'PORT': str(PORT), 'PATH': '/Users/chen/.nvm/versions/node/v22.22.0/bin:/usr/bin:/bin'}
import os
for k in ['HOME', 'SHELL']: env[k] = os.environ.get(k, '')
proc = subprocess.Popen(
    ['node', 'src/index.js'],
    cwd='/Users/chen/Documents/trae_projects/local_projects/may-89214/backend',
    stdout=open('/tmp/backend-59214.log', 'w'),
    stderr=subprocess.STDOUT,
    env={**os.environ, 'PORT': str(PORT)}
)
time.sleep(3)

r2 = subprocess.run(['lsof', '-ti', f'tcp:{PORT}'], capture_output=True, text=True)
new_pid = r2.stdout.strip()
print(f'New PID: {new_pid}')
with open('/tmp/backend-59214.log') as f:
    print('--- tail of log ---')
    lines = f.readlines()
    print(''.join(lines[-10:]))

print()
print('=== Verification ===')

# 1. Verify order list has route fields
r = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/api/orders?page=1&pageSize=5').read()
d = json.loads(r)
print('Order list route fields:')
for o in d['data']:
    print(f'  {o["order_no"]}: route_score={o.get("route_composite_score")} comp={o.get("compensation_count")} as={o.get("after_sales_count")}')

# 2. Verify order 5 detail
r = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/api/orders/5').read()
d = json.loads(r)['data']
print()
print('Order 5 detail:')
print(f'  route_score: {d.get("route_composite_score")}, reason: {(d.get("route_reason") or "")[:40]}')
print(f'  compensations: {len(d.get("compensations") or [])}, after_sales: {len(d.get("after_sales") or [])}')
for c in (d.get('compensations') or []):
    print(f'    comp: coupon={c.get("coupon_code")} reviewed_by={c.get("reviewed_by")} status={c.get("status")}')
for a in (d.get('after_sales') or []):
    print(f'    as: type={a.get("type")} sync={a.get("sync_status_text")} result={(a.get("disposal_result") or "")[:30]}')
