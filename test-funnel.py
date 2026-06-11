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
        return {'code': e.code, 'message': e.read().decode()[:500]}
    except Exception as e:
        return {'code': -1, 'message': str(e)[:500]}

r = api('POST', '/auth/login', {'email': 'hr@zhilian.com', 'password': '123456'})
token = r.get('data', {}).get('token', '')
print('Token:', token[:20] + '...' if token else 'NONE')

r = api('GET', '/applications/funnel/stats', token=token)
print('Funnel stats code:', r.get('code'))
print('Funnel stats msg:', r.get('message', '')[:300])
