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
        body = e.read().decode()
        return {'code': e.code, 'message': body[:300]}
    except Exception as e:
        return {'code': -1, 'message': str(e)[:300]}

r = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': '123456'})
token = r.get('data', {}).get('token', '')

for name, path in [('Channel ROI', '/analytics/channel-roi'), ('Hot Areas', '/analytics/hot-areas'), ('Verification', '/company/verification')]:
    r = api('GET', path, token=token)
    print(f'--- {name} ---')
    print(f'  code: {r.get("code")}')
    print(f'  message: {r.get("message", "")[:200]}')
    print()
