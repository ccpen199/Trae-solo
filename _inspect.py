import urllib.request, json

BASE = "http://127.0.0.1:59212/api"

def api(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# 登录
r = api("POST", "/auth/login", {"phone": "13800138001", "password": "123456"})
token = r["data"]["token"]
print("user:", r["data"]["user"]["nickname"])

# 商品列表字段
r = api("GET", "/products?limit=1", token=token)
p = r["data"]["list"][0]
print("\n=== Product fields ===")
for k, v in p.items():
    print(f"  {k}: {v}")

# 商品详情
r = api("GET", f"/products/{p['id']}", token=token)
print("\n=== Product detail ===")
for k, v in r["data"].items():
    print(f"  {k}: {v}")

# 优惠计算
r = api("POST", "/calculate-price", {"items": [{"productId": p["id"], "quantity": 3}]}, token=token)
print("\n=== Price calc ===")
if r["success"]:
    for k, v in r["data"].items():
        print(f"  {k}: {v}")
else:
    print("  error:", r)

# 订单列表字段
r = api("GET", "/orders?limit=1", token=token)
if r["data"]["list"]:
    o = r["data"]["list"][0]
    print("\n=== Order fields ===")
    for k, v in o.items():
        print(f"  {k}: {v}")
else:
    print("\nno orders")

# 佣金团队
r = api("GET", "/commission/team?days=30", token=token)
print("\n=== Commission team ===")
if r["success"]:
    for k, v in r["data"].items():
        print(f"  {k}: {v}")
else:
    print("  error:", r)

# 管理员登录
r2 = api("POST", "/auth/admin-login", {"username": "admin", "password": "admin123"})
at = r2["data"]["token"]
print("\nadmin:", r2["data"]["user"]["username"])

# 供应商
r = api("GET", "/admin/suppliers", token=at)
print("\n=== Suppliers ===")
if isinstance(r["data"], list):
    for s in r["data"]:
        print(f"  {s['name']}: {s.keys()}")
else:
    print(" data:", r["data"])

# 风控日志
r = api("GET", "/admin/risk/logs?limit=1", token=at)
print("\n=== Risk logs ===")
if r.get("success"):
    print(" data type:", type(r["data"]))
    if isinstance(r["data"], list) and r["data"]:
        for k, v in r["data"][0].items():
            print(f"  {k}: {v}")
    else:
        print(" data:", r["data"])
else:
    print(" error:", r)

# 结算
r = api("GET", "/admin/settlements?limit=1", token=at)
print("\n=== Settlements ===")
if r.get("success"):
    d = r["data"]
    print(" type:", type(d), "keys:", d.keys() if isinstance(d, dict) else "N/A")
    lst = d.get("list", d.get("items", [])) if isinstance(d, dict) else d
    if lst:
        for k, v in lst[0].items():
            print(f"  {k}: {v}")
else:
    print(" error:", r)

# 卡密池
r = api("GET", "/admin/card-pool/stats", token=at)
print("\n=== Card pool ===")
if r.get("success"):
    for k, v in r["data"].items():
        print(f"  {k}: {v}")
else:
    print(" error:", r)
