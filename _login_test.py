import urllib.request, json, urllib.error

BASE = "http://127.0.0.1:59219/api"

def login(user, pwd):
    data = json.dumps({"username": user, "password": pwd}).encode()
    req = urllib.request.Request(BASE + "/auth/login", data=data,
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=5).read())
        return {
            "http_status": 200,
            "token": resp.get("token") or resp.get("data", {}).get("token"),
            "user": resp.get("user") or resp.get("data", {}).get("user"),
            "raw_keys": sorted(resp.keys()),
            "raw": resp
        }
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            j = json.loads(body)
            return {"http_status": e.code, "error_code": j.get("code"), "error_msg": j.get("message"), "raw_keys": sorted(j.keys())}
        except:
            return {"http_status": e.code, "error_body": body[:200]}
    except Exception as e:
        return {"http_status": -1, "error": str(e)}

def me(token):
    req = urllib.request.Request(BASE + "/auth/me")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=5).read())
        d = resp.get("data", resp)
        return {"id": d.get("id"), "role": d.get("role"), "name": d.get("name"), "ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def get_endpoint(token, path):
    req = urllib.request.Request(BASE + path)
    req.add_header("Authorization", f"Bearer {token}")
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=5).read())
        d = resp.get("data", resp)
        keys = list(d.keys())[:8] if isinstance(d, dict) else type(d).__name__
        return {"ok": True, "type_keys": keys, "len": len(d) if isinstance(d, list) else (d.get("total") if isinstance(d, dict) and "total" in d else None)}
    except Exception as e:
        return {"ok": False, "error": str(e)}

print("=" * 65)
print("🔐 登录 & 角色权限端到端测试")
print("=" * 65)

# 1. 三个正常账号
print("\n1️⃣  正常账号登录测试")
for user, pwd in [("admin", "123456"), ("user1", "123456"), ("courier1", "123456")]:
    r = login(user, pwd)
    if r.get("token"):
        me_r = me(r["token"])
        print(f"   ✅ {user} / {pwd}: HTTP {r['http_status']}")
        print(f"        token: {'YES(' + r['token'][:20] + '...)' if r['token'] else 'NO'}")
        u = r.get("user") or {}
        print(f"        user role: {u.get('role')}  name: {u.get('name')}")
        print(f"        /auth/me: id={me_r.get('id')} role={me_r.get('role')} name={me_r.get('name')} ok={me_r.get('ok')}")
    else:
        print(f"   ❌ {user} / {pwd}: HTTP {r.get('http_status')}  err={r.get('error_msg') or r.get('error') or r.get('error_body')}")

# 2. 失败场景
print("\n2️⃣  失败场景错误反馈")
cases = [
    ("空账号", "", "123456"),
    ("空密码", "admin", ""),
    ("格式错误", "账号中文", "123456"),
    ("密码错误", "admin", "wrongpwd"),
    ("账号不存在", "nobody", "123456"),
]
for name, u, p in cases:
    r = login(u, p)
    status = r.get("http_status")
    msg = r.get("error_msg") or r.get("error") or r.get("error_body") or r.get("raw_keys")
    icon = "✅" if status >= 400 else "⚠️"
    print(f"   {icon} {name}: HTTP {status}  msg={msg}")

# 3. 三个角色的工作台接口权限
print("\n3️⃣  角色工作台数据接口可达性")
endpoints = {
    "admin": ["/dashboard/overview", "/orders?status=exception&pageSize=1",
              "/brands?pageSize=1", "/branches/throughput-stats",
              "/complaints?pageSize=1", "/dashboard/audit-logs?pageSize=1"],
    "user": ["/orders?pageSize=1", "/price/compare"],
    "courier": ["/couriers/workbench", "/complaints?pageSize=1"]
}
for user, pwd in [("admin", "123456"), ("user1", "123456"), ("courier1", "123456")]:
    lr = login(user, pwd)
    role = (lr.get("user") or {}).get("role") or user
    print(f"\n   🔑 {user} ({role}):")
    for ep in endpoints.get(role, []):
        r = get_endpoint(lr.get("token", ""), ep)
        print(f"      {ep}: ok={r.get('ok')} keys={r.get('type_keys')} total={r.get('len')}")

print("\n" + "=" * 65)
print("✅ 测试完成")
print("=" * 65)
