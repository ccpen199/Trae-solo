import urllib.request, json

def post(path, data):
    req = urllib.request.Request(
        'http://127.0.0.1:59215' + path,
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())

def get(path, token):
    req = urllib.request.Request(
        'http://127.0.0.1:59215' + path,
        headers={'Authorization': 'Bearer ' + token}
    )
    return json.loads(urllib.request.urlopen(req).read())

res = post('/api/auth/login', {'phone': '13900139000', 'password': 'admin123'})
admin_token = res['data']['token']
res2 = get('/api/auth/user', admin_token)
print('管理员: login=%s, user=%s, role=%s OK' % (res['code'], res2['code'], res2['data']['role']))

res = post('/api/auth/login', {'phone': '13800138001', 'password': '123456'})
t = res['data']['token']
res2 = get('/api/auth/user', t)
print('市民: login=%s, user=%s, role=%s OK' % (res['code'], res2['code'], res2['data']['role']))

res = post('/api/auth/login', {'phone': '13800138002', 'password': '123456'})
t = res['data']['token']
res2 = get('/api/auth/user', t)
print('办事员: login=%s, user=%s, role=%s OK' % (res['code'], res2['code'], res2['data']['role']))

res = post('/api/auth/login-sms', {'phone': '13800138001', 'code': '123456'})
print('验证码: login=%s, role=%s OK' % (res['code'], res['data']['user']['role']))

print('\nAll E2E tests passed')
