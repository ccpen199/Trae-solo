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

results = []

r = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': '123456'})
token = r.get('data', {}).get('token', '')
results.append(('1. HR Admin Login', r['code'], 'name=' + str(r.get('data',{}).get('user',{}).get('name',''))))

r2 = api('POST', '/auth/login', {'email': 'hr2@zhilian.com', 'password': '123456'})
results.append(('2. HR2 Login', r2['code'], 'name=' + str(r2.get('data',{}).get('user',{}).get('name',''))))

r3 = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': 'wrong'})
results.append(('3. Wrong Password', 'fail' if r3.get('code',0) != 0 else 'BUG', 'msg=' + str(r3.get('message',''))[:30]))

r4 = api('POST', '/auth/login', {'email': 'nobody@test.com', 'password': '123456'})
results.append(('4. Wrong Email', 'fail' if r4.get('code',0) != 0 else 'BUG', 'msg=' + str(r4.get('message',''))[:30]))

if token:
    biz_tests = [
        ('5. Dashboard', 'GET', '/analytics/dashboard'),
        ('6. Jobs List', 'GET', '/jobs?page=1&pageSize=10'),
        ('7. JD Templates', 'GET', '/jobs/templates'),
        ('8. Competency Tags', 'GET', '/jobs/tags'),
        ('9. Hot Areas', 'GET', '/jobs/hot/areas'),
        ('10. Candidates', 'GET', '/candidates?page=1&pageSize=10'),
        ('11. AI Match', 'POST', '/candidates/match/1/1'),
        ('12. Applications', 'GET', '/applications?page=1&pageSize=10'),
        ('13. App Funnel', 'GET', '/applications/funnel/stats'),
        ('14. Interviews', 'GET', '/interviews?page=1&pageSize=10'),
        ('15. Offers', 'GET', '/offers?page=1&pageSize=10'),
        ('16. Analytics Funnel', 'GET', '/analytics/funnel'),
        ('17. Channel ROI', 'GET', '/analytics/channel/roi'),
        ('18. Hot Areas Map', 'GET', '/analytics/hot/areas'),
        ('19. Trend 30d', 'GET', '/analytics/trend?days=30'),
        ('20. Company Info', 'GET', '/company/info'),
        ('21. Company Credit', 'GET', '/company/credit'),
        ('22. Profile', 'GET', '/auth/profile'),
        ('23. Channels', 'GET', '/analytics/channels'),
    ]
    for name, method, path in biz_tests:
        r = api(method, path, token=token)
        ok = r.get('code') == 0
        results.append((name, 'ok' if ok else 'FAIL', ''))

passed = sum(1 for _, s, _ in results if s in ['ok', 0])
failed = len(results) - passed
print(f'End-to-End: {passed}/{len(results)} passed')
for name, status, extra in results:
    s = 'OK' if status in ['ok', 0] else 'FAIL'
    print(f'  [{s}] {name} {extra}')
