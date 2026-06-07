import urllib.request
import urllib.error
import json

BASE = 'http://127.0.0.1:49040'

def get(path):
    req = urllib.request.Request(BASE + path, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode('utf-8'))
        return e.code, body

def post(path, data):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8')), resp.status
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode('utf-8'))
        return body, e.code

print("=" * 60)
print("  最终端到端验证")
print("=" * 60)

print("\n=== 1. 登录验证 ===")
for username in ['admin', 'platform', 'ops']:
    d, status = post('/api/auth/login', {'username': username, 'password': '123456', 'auth_source': 'local'})
    if d['success']:
        u = d['data']
        print(f"  ✅ {username}: {u['real_name']} (role={u['role']}, id={u['id'][:8]})")
    else:
        print(f"  ❌ {username}: {d.get('message')}")

print("\n=== 2. 多源认证 ===")
for name, path, params in [
    ('CA证书', '/api/auth/ca-login', {'type': 'ca'}),
    ('支付宝扫码', '/api/auth/qr-login', {'channel': '支付宝'}),
    ('闽政通扫码', '/api/auth/qr-login', {'channel': '闽政通'}),
]:
    d, _ = post(path, params)
    if d['success']:
        u = d['data']
        print(f"  ✅ {name}: {u['real_name']} (source={u['auth_source']})")
    else:
        print(f"  ❌ {name}: {d.get('message')}")

print("\n=== 3. 业务API验证（修正路径）===")
apis = [
    ('/api/dashboard/stats', '工作台统计'),
    ('/api/dashboard/top-services', '高频事项TOP10'),
    ('/api/dashboard/visit-trend', '访问趋势'),
    ('/api/dashboard/approval-list', '审批列表'),
    ('/api/dashboard/work-orders', '工单列表'),
    ('/api/services/items', '事项列表'),
    ('/api/services/categories', '事项分类'),
    ('/api/payment/stats', '支付统计'),
    ('/api/collaboration/materials', '共享材料'),
    ('/api/collaboration/approvals', '审批任务'),
    ('/api/interactive/consult', 'AI咨询'),
    ('/api/monitoring/availability', '服务可用性'),
    ('/api/monitoring/biz-metrics', '营商环境指标'),
    ('/api/monitoring/behavior', '行为分析'),
    ('/api/auth/logs', '认证日志'),
    ('/api/auth/stats', '认证统计'),
]
for api_path, name in apis:
    if 'consult' in api_path:
        d, status = post(api_path, {'question': 'test'})
        ok = d.get('success', False)
    else:
        status, d = get(api_path)
        ok = d.get('success', False)
    print(f"  {'✅' if ok else '⚠️'} {name}: HTTP {status}")

print("\n=== 4. 进程存活确认 ===")
import subprocess
for port in [49040, 59040]:
    result = subprocess.run(['lsof', '-nP', f'-iTCP:{port}', '-sTCP:LISTEN', '-t'], capture_output=True, text=True)
    pid = result.stdout.strip().split('\n')[0] if result.stdout.strip() else 'N/A'
    print(f"  Port {port}: PID {pid}")

print("\n" + "=" * 60)
print("  ✅ 验证完成")
print("=" * 60)
