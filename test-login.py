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
        return {'code': e.code, 'message': e.read().decode()[:300]}
    except Exception as e:
        return {'code': -1, 'message': str(e)[:300]}

print('=== HR Admin Login ===')
r = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': '123456'})
if r.get('code') == 0:
    token = r['data']['token']
    user = r['data']['user']
    print(f'  OK: name={user.get("name")}, role={user.get("role")}, company={user.get("company_name")}')
    
    print('\n=== Core Business APIs ===')
    endpoints = [
        ('Dashboard', 'GET', '/analytics/dashboard'),
        ('Jobs', 'GET', '/jobs?page=1&pageSize=10'),
        ('Templates', 'GET', '/jobs/templates'),
        ('Tags', 'GET', '/jobs/tags'),
        ('Candidates', 'GET', '/candidates?page=1&pageSize=10'),
        ('Applications', 'GET', '/applications?page=1&pageSize=10'),
        ('Interviews', 'GET', '/interviews?page=1&pageSize=10'),
        ('Offers', 'GET', '/offers?page=1&pageSize=10'),
        ('Funnel', 'GET', '/analytics/funnel'),
        ('ChannelROI', 'GET', '/analytics/channel/roi'),
        ('HotAreas', 'GET', '/analytics/hot/areas'),
        ('Company', 'GET', '/company/info'),
        ('Credit', 'GET', '/company/credit'),
    ]
    passed = 0
    for name, method, path in endpoints:
        r2 = api(method, path, token=token)
        ok = r2.get('code') == 0
        if ok: passed += 1
        s = 'OK' if ok else 'FAIL'
        print(f'  [{s}] {name}')
    print(f'\nResult: {passed}/{len(endpoints)} passed')
else:
    print(f'  FAIL: {r}')

print('\n=== HR2 Login ===')
r = api('POST', '/auth/login', {'email': 'hr2@zhilian.com', 'password': '123456'})
if r.get('code') == 0:
    user = r['data']['user']
    print(f'  OK: name={user.get("name")}, role={user.get("role")}')
else:
    print(f'  FAIL: {r.get("message")}')

print('\n=== Wrong Password ===')
r = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': 'wrong'})
print(f'  code={r.get("code")}, msg={r.get("message")}')

print('\n=== Wrong Email ===')
r = api('POST', '/auth/login', {'email': 'nobody@test.com', 'password': '123456'})
print(f'  code={r.get("code")}, msg={r.get("message")}')
