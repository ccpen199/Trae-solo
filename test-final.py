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
results.append(('1. Login', r['code'], 'token=' + str(len(token)) + 'chars'))

if token:
    tests = [
        ('2. Jobs List', 'GET', '/jobs?page=1&pageSize=5'),
        ('3. JD Templates', 'GET', '/jobs/templates'),
        ('4. Competency Tags', 'GET', '/jobs/tags'),
        ('5. Jobs Hot Areas', 'GET', '/jobs/hot/areas'),
        ('6. Candidates', 'GET', '/candidates?page=1&pageSize=5'),
        ('7. Candidate Match', 'POST', '/candidates/match/1/1'),
        ('8. Applications', 'GET', '/applications?page=1&pageSize=5'),
        ('9. Application Funnel', 'GET', '/applications/funnel/stats'),
        ('10. Interviews', 'GET', '/interviews?page=1&pageSize=5'),
        ('11. Offers', 'GET', '/offers?page=1&pageSize=5'),
        ('12. Dashboard', 'GET', '/analytics/dashboard'),
        ('13. Analytics Funnel', 'GET', '/analytics/funnel'),
        ('14. Channel ROI', 'GET', '/analytics/channel/roi'),
        ('15. Job Performance', 'GET', '/analytics/jobs/performance'),
        ('16. Hot Areas', 'GET', '/analytics/hot/areas'),
        ('17. Candidate Sources', 'GET', '/analytics/candidates/source'),
        ('18. 30d Trend', 'GET', '/analytics/trend?days=30'),
        ('19. Channels', 'GET', '/analytics/channels'),
        ('20. Company Info', 'GET', '/company/info'),
        ('21. Company Credit', 'GET', '/company/credit'),
        ('22. Profile', 'GET', '/auth/profile'),
    ]
    for name, method, path in tests:
        r = api(method, path, token=token)
        extra = ''
        if r['code'] == 0:
            d = r.get('data', {})
            if isinstance(d, dict):
                if 'list' in d:
                    extra = f' items={len(d["list"])}'
                elif 'total' in d:
                    extra = f' total={d["total"]}'
        results.append((name, r['code'], extra))

    r = api('POST', '/jobs', {
        'title': '测试岗位',
        'department': '技术部',
        'city': '北京',
        'salary_min': 15000,
        'salary_max': 25000,
        'description': '这是一个测试岗位',
        'requirements': '3年以上工作经验',
        'type': 'fulltime',
        'experience': '3-5年',
        'education': '本科'
    }, token=token)
    results.append(('23. Create Job', r['code'], 'msg=' + r.get('message', '')[:30]))

    r = api('POST', '/jobs', {
        'title': '高薪急招研发总监月薪8万',
        'department': '研发部',
        'city': '北京',
        'salary_min': 50000,
        'salary_max': 80000,
        'description': '急急急',
        'requirements': '不限',
        'type': 'fulltime',
        'experience': '不限',
        'education': '不限'
    }, token=token)
    results.append(('24. Fraud Job Test', r['code'], 'msg=' + r.get('message', '')[:30]))

passed = sum(1 for _, c, _ in results if c == 0)
failed = len(results) - passed
print(f'API Test: {passed}/{len(results)} passed, {failed} failed')
print('=' * 60)
for name, code, extra in results:
    s = 'OK' if code == 0 else 'FAIL'
    print(f'  [{s}] {name} code={code} {extra}')
