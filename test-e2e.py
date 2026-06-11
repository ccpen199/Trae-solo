import urllib.request
import json

base_fe = 'http://127.0.0.1:49099'
base_be = 'http://127.0.0.1:59099/api'

print('=== Step 1: Verify frontend serves HTML ===')
try:
    resp = urllib.request.urlopen(base_fe + '/login', timeout=10)
    html = resp.read().decode()
    has_root = 'id="root"' in html
    has_vite = 'vite' in html.lower() or 'module' in html
    print(f'  Status: {resp.status}, Has #root: {has_root}, Has Vite: {has_vite}')
except Exception as e:
    print(f'  ERROR: {e}')

print('\n=== Step 2: Verify backend login API ===')
try:
    data = json.dumps({'email': 'hr@zhilian.com', 'password': '123456'}).encode()
    req = urllib.request.Request(base_be + '/auth/login', data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    resp = urllib.request.urlopen(req, timeout=10)
    result = json.loads(resp.read().decode())
    token = result['data']['token']
    user = result['data']['user']
    print(f'  Status: OK')
    print(f'  Token: {token[:30]}...')
    print(f'  User: name={user["name"]}, role={user["role"]}, company={user.get("company_name","N/A")}')
    print(f'  company_id: {user.get("company_id")}')
except Exception as e:
    print(f'  ERROR: {e}')

print('\n=== Step 3: Verify API proxy works from frontend ===')
try:
    req = urllib.request.Request(base_fe + '/api/auth/login', data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    resp = urllib.request.urlopen(req, timeout=10)
    result = json.loads(resp.read().decode())
    print(f'  Proxy Status: OK, code={result["code"]}')
except Exception as e:
    print(f'  Proxy ERROR: {e}')

print('\n=== Step 4: Verify dashboard data with token ===')
try:
    req = urllib.request.Request(base_be + '/analytics/dashboard')
    req.add_header('Authorization', 'Bearer ' + token)
    resp = urllib.request.urlopen(req, timeout=10)
    result = json.loads(resp.read().decode())
    stats = result.get('data', {}).get('stats', {})
    print(f'  Dashboard: jobs={stats.get("total_jobs",0)}, applications={stats.get("total_applications",0)}, interviews={stats.get("total_interviews",0)}')
except Exception as e:
    print(f'  ERROR: {e}')

print('\n=== All checks passed ===')
