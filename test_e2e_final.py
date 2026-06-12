import json, urllib.request, urllib.error

all_pass = True

def test(name, fn):
    global all_pass
    try:
        result = fn()
        print(f"✅ {name}: {result}")
    except Exception as e:
        print(f"❌ {name}: {e}")
        all_pass = False

# 1. 登录 admin
def t1():
    data = json.dumps({"username":"admin","password":"123456"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    assert d['token'] and d['user']['role'] == 'admin'
    return f"role=admin, token_len={len(d['token'])}"

# 2. 登录 trainer01
def t2():
    data = json.dumps({"username":"trainer01","password":"123456"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    assert d['user']['role'] == 'trainer'
    return f"role=trainer, token_len={len(d['token'])}"

# 3. 角色切换 trainer → hr
def t3():
    data = json.dumps({"username":"trainer01","password":"123456"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    resp = urllib.request.urlopen(req)
    t = json.loads(resp.read())['token']
    data = json.dumps({"role":"hr"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/switch-role", data=data, headers={"Content-Type":"application/json", "Authorization":f"Bearer {t}"})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    assert d['user']['role'] == 'hr'
    assert d['user'].get('tenantId') or d['user'].get('tenant_id')
    return f"new_role=hr, new_token={len(d['token'])}"

# 4. 可用角色列表
def t4():
    data = json.dumps({"username":"admin","password":"123456"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    resp = urllib.request.urlopen(req)
    t = json.loads(resp.read())['token']
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/roles/available", headers={"Authorization":f"Bearer {t}"})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    assert len(d['roles']) >= 3
    return f"{[r['key'] for r in d['roles']]}"

# 5. RBAC 权限边界
def t5():
    data = json.dumps({"username":"admin","password":"123456"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    resp = urllib.request.urlopen(req)
    t = json.loads(resp.read())['token']
    req = urllib.request.Request("http://127.0.0.1:49168/api/permissions", headers={"Authorization":f"Bearer {t}"})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    assert d['stats']['permissionCount'] == 16
    assert len(d['rolePermissions']) == 4
    return f"{d['stats']['permissionCount']}项控制, 4角色矩阵"

# 6. 审计日志
def t6():
    data = json.dumps({"username":"admin","password":"123456"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    resp = urllib.request.urlopen(req)
    t = json.loads(resp.read())['token']
    req = urllib.request.Request("http://127.0.0.1:49168/api/users/audit/logs?page=1&size=5", headers={"Authorization":f"Bearer {t}"})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    assert 'items' in d and 'total' in d
    return f"total={d['total']}条"

# 7. 错误密码反馈
def t7():
    data = json.dumps({"username":"admin","password":"wrongpass"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    try:
        urllib.request.urlopen(req)
        raise AssertionError("should return 401")
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        assert e.code == 401
        msg = err.get('error') or err.get('message')
        assert msg
        return f"HTTP 401, msg={msg}"

# 8. 不存在用户反馈
def t8():
    data = json.dumps({"username":"nonexist","password":"123456"}).encode()
    req = urllib.request.Request("http://127.0.0.1:49168/api/auth/login", data=data, headers={"Content-Type":"application/json"})
    try:
        urllib.request.urlopen(req)
        raise AssertionError("should return 401")
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        assert e.code == 401
        msg = err.get('error') or err.get('message')
        assert msg
        return f"HTTP 401, msg={msg}"

test("[1] admin登录", t1)
test("[2] trainer01登录", t2)
test("[3] 角色切换 trainer→HR", t3)
test("[4] 可用角色列表", t4)
test("[5] RBAC权限边界API", t5)
test("[6] 审计日志API", t6)
test("[7] 错误密码反馈", t7)
test("[8] 不存在用户反馈", t8)

print()
print("="*60)
if all_pass:
    print("🎯 全部8项测试通过！")
    print("📱 浏览器访问: http://127.0.0.1:49168/login")
    print("🔑 测试账号: admin / trainer01 / hr01 / seeker01")
    print("🔐 统一密码: 123456")
    print("="*60)
else:
    print("❌ 部分测试失败，请检查")
