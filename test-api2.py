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
    except urllib.error.HTTPError as e:
        return {'code': e.code, 'message': e.read().decode()[:200]}
    except Exception as e:
        return {'code': -1, 'message': str(e)[:200]}

results = []

r = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': '123456'})
token = r.get('data', {}).get('token', '')
results.append(('Login', r['code']))

if token:
    tests = [
        ('Jobs List', 'GET', '/jobs?page=1&pageSize=5'),
        ('JD Templates', 'GET', '/jobs/templates'),
        ('Tags', 'GET', '/jobs/tags'),
        ('Hot Areas', 'GET', '/jobs/hot/areas'),
        ('Candidates', 'GET', '/candidates?page=1&pageSize=5'),
        ('Applications', 'GET', '/applications?page=1&pageSize=5'),
        ('Interviews', 'GET', '/interviews?page=1&pageSize=5'),
        ('Offers', 'GET', '/offers?page=1&pageSize=5'),
        ('Dashboard', 'GET', '/analytics/dashboard'),
        ('Funnel', 'GET', '/analytics/funnel'),
        ('Channel ROI', 'GET', '/analytics/channel/roi'),
        ('Job Perf', 'GET', '/analytics/jobs/performance'),
        ('Hot Areas A', 'GET', '/analytics/hot/areas'),
        ('Sources', 'GET', '/analytics/candidates/source'),
        ('Trend', 'GET', '/analytics/trend?days=30'),
        ('Channels', 'GET', '/analytics/channels'),
        ('Company', 'GET', '/company/info'),
        ('Credit', 'GET', '/company/credit'),
        ('Profile', 'GET', '/auth/profile'),
    ]
    for name, method, path in tests:
        r = api(method, path, token=token)
        results.append((name, r['code']))

passed = sum(1 for _, c in results if c == 0)
failed = len(results) - passed
print(f'Result: {passed}/{len(results)} passed, {failed} failed')
for name, code in results:
    s = 'OK' if code == 0 else 'FAIL'
    print(f'  [{s}] {name} (code={code})')
