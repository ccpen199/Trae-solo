#!/usr/bin/env python3
import json, urllib.request, urllib.error

BASE = "http://127.0.0.1:59218/api"

def req(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            t = resp.read().decode()
            return {"_status": resp.getcode(), "_body": json.loads(t) if t.strip() else {}}
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        try:
            return {"_status": e.code, "_body": json.loads(t)}
        except:
            return {"_status": e.code, "_body": {"_raw": t}}

print("="*60)
print("[1] 雇主登录")
r = req("POST", "/auth/login", {"username": "employer1", "password": "123456"})
print(f"  HTTP: {r['_status']}")
print(f"  响应key: {list(r['_body'].keys())}")
token = r['_body'].get('token', '')
print(f"  token: {token[:40]}..." if len(token) > 40 else f"  token: {token}")
user = r['_body'].get('user', {})
print(f"  user.role: {user.get('role')}")
print(f"  user.real_name: {user.get('real_name')}")
print(f"  user.phone: {user.get('phone')}")

print("\n[2] 用工订单列表（不带筛选）")
r = req("GET", "/labor-orders?page=1&limit=10", token=token)
print(f"  HTTP: {r['_status']}")
orders = r['_body'].get('orders', [])
total = r['_body'].get('total', 0)
print(f"  订单数: {len(orders)} / 总数: {total}")
for o in orders[:2]:
    print(f"    - {o.get('title')[:30]} status={o.get('status')} price={o.get('total_price')}")

print("\n[3] 用工订单列表 status=pending 筛选")
r = req("GET", "/labor-orders?page=1&limit=10&status=pending", token=token)
orders2 = r['_body'].get('orders', [])
print(f"  HTTP: {r['_status']}  pending数: {len(orders2)} / {r['_body'].get('total', 0)}")

print("\n[4] 找车订单列表（不带筛选）")
r = req("GET", "/delivery-orders?page=1&limit=10", token=token)
print(f"  HTTP: {r['_status']}")
orders = r['_body'].get('orders', [])
total = r['_body'].get('total', 0)
print(f"  订单数: {len(orders)} / 总数: {total}")
for o in orders[:2]:
    print(f"    - {o.get('title')[:30]} status={o.get('status')} price={o.get('bid_start_price') or o.get('final_price')}")

print("\n[5] 搬家订单列表（不带筛选）")
r = req("GET", "/moving-orders?page=1&limit=10", token=token)
print(f"  HTTP: {r['_status']}")
orders = r['_body'].get('orders', [])
total = r['_body'].get('total', 0)
print(f"  订单数: {len(orders)} / 总数: {total}")
for o in orders[:2]:
    print(f"    - {o.get('title')[:30]} status={o.get('status')} price={o.get('total_price')}")

print("\n[6] 工人登录")
r = req("POST", "/auth/login", {"username": "worker1", "password": "123456"})
print(f"  HTTP: {r['_status']}")
print(f"  token存在: {'token' in r['_body']}")
print(f"  role: {r['_body']['user']['role']}")
print(f"  worker_profile: {r['_body']['user'].get('worker_profile')}")

print("\n[7] 司机登录")
r = req("POST", "/auth/login", {"username": "driver1", "password": "123456"})
print(f"  HTTP: {r['_status']}")
print(f"  token存在: {'token' in r['_body']}")
print(f"  role: {r['_body']['user']['role']}")
print(f"  driver_profile: {r['_body']['user'].get('driver_profile')}")

print("\n[8] 管理员登录")
r = req("POST", "/auth/login", {"username": "admin", "password": "admin123"})
print(f"  HTTP: {r['_status']}")
print(f"  token存在: {'token' in r['_body']}")
print(f"  role: {r['_body']['user']['role']}")

print("\n" + "="*60)
