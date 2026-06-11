import urllib.request
import json

base = 'http://127.0.0.1:59099/api'

def api(method, path, data=None, token=None):
    url = base + path
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {'code': -1, 'message': str(e)}

results = []

r = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': '123456'})
token = r.get('data', {}).get('token', '')
results.append(('Login', r['code'], r['message']))

if token:
    tests = [
        ('Jobs List', 'GET', '/jobs?page=1&pageSize=5'),
        ('JD Templates', 'GET', '/jobs/templates'),
        ('Competency Tags', 'GET', '/jobs/tags'),
        ('Candidates', 'GET', '/candidates?page=1&pageSize=5'),
        ('Applications', 'GET', '/applications?page=1&pageSize=5'),
        ('Interviews', 'GET', '/interviews?page=1&pageSize=5'),
        ('Offers', 'GET', '/offers?page=1&pageSize=5'),
        ('Dashboard', 'GET', '/analytics/dashboard'),
        ('Funnel', 'GET', '/analytics/funnel'),
        ('Channel ROI', 'GET', '/analytics/channel-roi'),
        ('Hot Areas', 'GET', '/analytics/hot-areas'),
        ('Trend', 'GET', '/analytics/trend?days=30'),
        ('Company Info', 'GET', '/company/info'),
        ('Company Credit', 'GET', '/company/credit'),
        ('Verification', 'GET', '/company/verification'),
        ('Profile', 'GET', '/auth/profile'),
    ]
    for name, method, path in tests:
        r = api(method, path, token=token)
        results.append((name, r['code'], r['message']))
else:
    results.append(('Token', -1, 'No token received'))

passed = sum(1 for _, c, _ in results if c == 0)
failed = len(results) - passed
print(f'Total: {len(results)}, Passed: {passed}, Failed: {failed}')
print('-' * 60)
for name, code, msg in results:
    status = 'OK' if code == 0 else 'FAIL'
    print(f'  [{status}] {name}: code={code}')
