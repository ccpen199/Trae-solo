import urllib.request
import urllib.error
import json

def api(path, data=None, token=None, method=None):
    url = "http://127.0.0.1:49013/api" + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    body = json.dumps(data).encode() if data else None
    req_method = method or ('POST' if data else 'GET')
    req = urllib.request.Request(url, data=body, headers=headers, method=req_method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        content = e.read()
        return json.loads(content.decode()) if content else {'code': -1, 'message': str(e)}

print("=" * 60)
print("1. 管理员登录 (admin / admin123)")
r = api('/auth/login', {'phone': 'admin', 'password': 'admin123'})
print("   code=" + str(r.get('code')) + ", role=" + str(r.get('data',{}).get('rider',{}).get('role')) + ", msg=" + str(r.get('message')))
assert r.get('code') == 0, "失败: " + str(r)
assert r['data']['rider']['role'] == 'admin', "角色错误"
admin_token = r['data']['token']
print("   ✅ 管理员登录成功")
print()

print("2. 骑手登录 (13800001001 / 123456)")
r = api('/auth/login', {'phone': '13800001001', 'password': '123456'})
print("   code=" + str(r.get('code')) + ", role=" + str(r.get('data',{}).get('rider',{}).get('role')) + ", msg=" + str(r.get('message')))
assert r.get('code') == 0
assert r['data']['rider']['role'] == 'rider', "角色错误"
rider_token = r['data']['token']
print("   ✅ 骑手登录成功")
print()

print("3. 密码错误测试 (admin / wrong)")
r = api('/auth/login', {'phone': 'admin', 'password': 'wrong'})
print("   code=" + str(r.get('code')) + ", msg=" + str(r.get('message')))
assert r.get('code') == 1, "密码错误应该返回 code=1"
print("   ✅ 密码错误提示正确")
print()

print("4. getMe 接口验证 (admin token)")
r = api('/auth/me', token=admin_token)
print("   code=" + str(r.get('code')) + ", role=" + str(r.get('data',{}).get('role')) + ", name=" + str(r.get('data',{}).get('name')))
assert r.get('code') == 0
assert r['data']['role'] == 'admin'
print("   ✅ getMe 接口正常")
print()

print("5. 管理员访问仪表盘")
r = api('/admin/dashboard', token=admin_token)
print("   code=" + str(r.get('code')) + ", total_riders=" + str(r.get('data',{}).get('total_riders')))
assert r.get('code') == 0
print("   ✅ 管理仪表盘可访问")
print()

print("6. 骑手 token 访问管理后台（应该被拒绝）")
r = api('/admin/dashboard', token=rider_token)
print("   code=" + str(r.get('code')) + ", msg=" + str(r.get('message')))
assert r.get('code') != 0, "骑手应该不能访问管理后台"
print("   ✅ 权限拦截正常")
print()

print("7. 骑手查看自己的订单列表")
r = api('/orders', token=rider_token)
print("   code=" + str(r.get('code')) + ", total=" + str(r.get('data',{}).get('total')))
assert r.get('code') == 0
print("   ✅ 骑手订单列表正常")
print()

print("8. 骑手查看余额")
r = api('/settlements/balance', token=rider_token)
print("   code=" + str(r.get('code')) + ", balance=" + str(r.get('data',{}).get('balance')))
assert r.get('code') == 0
print("   ✅ 余额查询正常")
print()

print("=" * 60)
print("✅ 所有 8 项登录与权限测试全部通过")
print("=" * 60)
