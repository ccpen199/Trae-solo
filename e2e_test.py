import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:49242/api"

def http_post(path, body, headers=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def http_get(path, headers=None):
    req = urllib.request.Request(BASE + path, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def test_login(phone, code, cid, expected_role, expected_name, expected_redirect):
    print(f"\n--- TEST: phone={phone} cid={cid} ({expected_role} {expected_name}) -> {expected_redirect}")
    status, step1 = http_post("/auth/login", {"phone": phone, "verification_code": code, "community_id": cid})
    ok = step1.get("success")
    print(f"  Step1 Login: status={status} success={ok}")
    assert ok, f"Failed: {step1.get('error')}"
    token = step1["data"]["token"]
    role = step1["data"]["user"]["role"]
    name = step1["data"]["user"]["real_name"]
    comm = step1["data"]["community"]["name"]
    print(f"  Step1 Result: role={role} name={name} community={comm}")
    assert role == expected_role, f"期望 role={expected_role} 实际 {role}"
    assert name == expected_name, f"期望 name={expected_name} 实际 {name}"
    print(f"  Step2: GET /auth/me with Bearer token")
    status2, step2 = http_get("/auth/me", {"Authorization": f"Bearer {token}"})
    assert step2.get("success"), f"/auth/me 失败: {step2}"
    me_role = step2["data"]["role"]
    print(f"  Step2 Result: status={status2} success={step2['success']} role={me_role}")
    print(f"  ✅ PASSED ({role} -> {expected_redirect})")

print("=" * 60)
print("E2E TEST: 完整角色登录流程")
print("=" * 60)

try:
    test_login("10000000000", "123456", 1, "platform_admin", "平台管理员", "/admin")
    test_login("13800000001", "123456", 1, "property_admin", "张三", "/property")
    test_login("13800000002", "123456", 2, "property_admin", "李四", "/property")
    test_login("13800000004", "123456", 1, "resident", "赵六", "/")
    test_login("13800000007", "123456", 3, "resident", "周九", "/")
    print("\n" + "=" * 60)
    print("✅ 成功场景全部通过")
    print("=" * 60)
except AssertionError as e:
    print(f"  ❌ ASSERT FAIL: {e}")
    exit(1)

print("\n" + "=" * 60)
print("失败场景测试")
print("=" * 60)

print("\n--- 验证码错误 (654321) ---")
status, r = http_post("/auth/login", {"phone":"13800000004","verification_code":"654321","community_id":1})
print(f"  HTTP {status} success={r.get('success')} error={r.get('error')}")
assert r.get("success") is False and r.get("error") == "验证码错误"

print("\n--- 错误社区 (手机号在社区1, 查询社区2) ---")
status, r = http_post("/auth/login", {"phone":"13800000004","verification_code":"123456","community_id":2})
print(f"  HTTP {status} success={r.get('success')} error={r.get('error')}")
assert r.get("success") is False and "未注册" in r.get("error","")

print("\n--- 缺少社区 ---")
status, r = http_post("/auth/login", {"phone":"13800000004","verification_code":"123456"})
print(f"  HTTP {status} success={r.get('success')} error={r.get('error')}")
assert r.get("success") is False and "社区" in r.get("error","")

print("\n--- SAML Demo 登录 (社区2) ---")
status, r = http_post("/auth/saml/demo", {"community_id":2})
u = r.get("data", {}).get("user", {})
print(f"  HTTP {status} success={r.get('success')} role={u.get('role')} name={u.get('real_name')} saml_id={u.get('saml_id')}")
assert r.get("success") is True and u.get("role") == "property_admin" and u.get("saml_id")

print("\n--- 社区列表 ---")
status, r = http_get("/auth/communities")
print(f"  HTTP {status} success={r.get('success')} count={len(r.get('data', []))}")
for c in r.get("data", []):
    print(f"    id={c['id']} name={c['name']} subdomain={c['subdomain']}")
assert r.get("success") is True and len(r.get("data", [])) == 3

print("\n" + "=" * 60)
print("✅ 全部 E2E 测试通过")
print("=" * 60)
