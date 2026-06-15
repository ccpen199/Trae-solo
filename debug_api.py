#!/usr/bin/env python3
import json
import urllib.request

BASE = "http://127.0.0.1:59218/api"

def req(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    r = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            text = resp.read().decode("utf-8")
            return json.loads(text) if text.strip() else {}
    except Exception as e:
        return {"_error": str(e), "_raw": getattr(e, 'read', lambda: b'')().decode('utf-8', errors='replace')[:300]}

def login(u, p):
    r = req("POST", "/auth/login", {"username": u, "password": p})
    return r.get("token", "")

emp = login("employer1", "123456")
w = login("worker1", "123456")
admin = login("admin", "admin123")

print("=== 1. 工人列表 ===")
r = req("GET", "/auth/workers")
print("type:", type(r).__name__, "| 结构keys:", list(r.keys()) if isinstance(r, dict) else f"列表长度={len(r)}")
if isinstance(r, list) and r:
    print("  [0]:", list(r[0].keys())[:10])

print("\n=== 2. 发布用工订单 ===")
r = req("POST", "/labor-orders", {
    "title": "测试", "description": "x",
    "skills": ["搬运"], "pricing_type": "hourly",
    "hourly_rate": 50, "estimated_hours": 4,
    "city": "北京", "address": "x"
}, emp)
print("type:", type(r).__name__)
print("keys:", list(r.keys()) if isinstance(r, dict) else "不是dict")
if isinstance(r, dict):
    for k in ['id', 'title', 'status', 'total_price', 'data', 'error', 'message']:
        if k in r: print(f"  {k}:", str(r[k])[:80])

print("\n=== 3. 用工订单列表 ===")
r = req("GET", "/labor-orders")
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
if isinstance(r, dict):
    for k in ['data', 'list', 'orders', 'total', 'count']:
        if k in r:
            v = r[k]
            if isinstance(v, list): print(f"  {k}列表: {len(v)}项")
            else: print(f"  {k}: {v}")

print("\n=== 4. GPS API 检查 ===")
r1 = req("POST", "/gps", {"order_type":"labor","order_id":"test","latitude":39.99,"longitude":116.47,"timestamp":"2026-06-15T10:00:00Z"}, w)
print("POST /gps 返回:", type(r1).__name__, str(r1)[:100])

print("\n=== 5. 后台 stats ===")
r = req("GET", "/admin/stats", token=admin)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:300])

print("\n=== 6. 后台 capacity ===")
r = req("GET", "/admin/capacity", token=admin)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:300])

print("\n=== 7. 后台 prices ===")
r = req("GET", "/admin/prices", token=admin)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:300])

print("\n=== 8. 后台 quality-rules ===")
r = req("GET", "/admin/quality-rules", token=admin)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:400])

print("\n=== 9. 搬家服务包 ===")
r = req("GET", "/moving-orders/service-packages/list")
print("type:", type(r).__name__)
if isinstance(r, dict):
    for k in r: print(f"  {k}: {str(r[k])[:150]}")
elif isinstance(r, list):
    print("  list:", str(r)[:300])

print("\n=== 10. 发布搬家订单(简化) ===")
r = req("POST", "/moving-orders", {
    "title": "测试搬家",
    "from_address": "a", "to_address": "b",
    "from_floor": 3, "from_has_elevator": True,
    "to_floor": 5, "to_has_elevator": False,
    "distance_km": 10, "service_package": "basic",
    "city": "北京", "items": [],
}, emp)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:400])

print("\n=== 11. 找车发布 ===")
r = req("POST", "/delivery-orders", {
    "title": "测试运货", "description": "x",
    "vehicle_type": "厢式货车", "load_weight": 1,
    "from_city": "a", "from_address": "b",
    "to_city": "c", "to_address": "d",
    "distance_km": 10, "expected_price": 200,
}, emp)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:300])

print("\n=== 12. 保险申请 ===")
r = req("POST", "/insurance-claims", {
    "order_type": "moving", "order_id": "xxx",
    "claim_type": "damage", "claim_amount": 500,
    "description": "测试",
}, emp)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:300])

print("\n=== 13. 纠纷提交 ===")
r = req("POST", "/disputes", {
    "order_type":"labor", "order_id":"yyy",
    "dispute_type":"quality", "title":"t",
    "description":"d", "claim_amount":100,
}, emp)
print("type:", type(r).__name__, "keys:", list(r.keys()) if isinstance(r, dict) else "")
print("values:", str(r)[:300])
