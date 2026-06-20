#!/usr/bin/env python3
import requests
import json
import sys

BASE = "http://localhost:3000/api"

def login(u, p):
    r = requests.post(f"{BASE}/auth/login", json={"username": u, "password": p})
    d = r.json()
    if d.get("code") != 200:
        print(f"login failed {u}:", d)
        sys.exit(1)
    return d["data"]["token"]

def h(t): return {"Authorization": f"Bearer {t}"}

ct = login("courier1", "courier123")
at = login("admin1", "admin123")
ot = login("operator1", "operator123")
print("login OK")

# Courier: dashboard
r = requests.get(f"{BASE}/dashboard", headers=h(ct))
d = r.json().get("data", {})
print("\n=== Courier1 dashboard ===")
print("stats:", d.get("stats"))
print("alerts:", [(a["level"], a["title"]) for a in d.get("alerts", [])])
print("unreadCount:", d.get("unreadCount"))

# Courier: tasks (本人)
r = requests.get(f"{BASE}/tasks", params={"pageSize": 5}, headers=h(ct))
d = r.json().get("data", {})
print("\n=== Courier1 tasks ===")
print("total:", d.get("total"))
for t in d.get("list", []):
    print("  -", t.get("taskNo"), t.get("status"), "courier:", t.get("courierName"), t.get("courierId"), "appt:", t.get("appointmentTime"))

# Admin: dashboard + waybill
r = requests.get(f"{BASE}/dashboard", headers=h(at))
d = r.json().get("data", {})
print("\n=== Admin1 dashboard ===")
print("stats:", d.get("stats"))
print("waybill.balance:", d.get("waybill",{}).get("balance"), "threshold:", d.get("waybill",{}).get("lowBalanceThreshold"))
print("alerts:", [(a["level"], a["title"]) for a in d.get("alerts", [])])

# Admin: finance overview
r = requests.get(f"{BASE}/finance/overview", headers=h(at))
d = r.json().get("data", {})
print("\n=== Admin1 finance overview ===")
print(json.dumps(d, ensure_ascii=False, indent=2)[:600])

# Admin: finance daily
r = requests.get(f"{BASE}/finance/daily", params={"pageSize": 3}, headers=h(at))
d = r.json().get("data", {})
print("\n=== Admin1 finance daily (本网点) ===")
print("total:", d.get("total"))
for r_ in d.get("list", []):
    print("  -", r_.get("date"), r_.get("outletName"), "orders:", r_.get("totalOrders"), "net:", r_.get("netIncome"))

# Operator: finance daily (全局)
r = requests.get(f"{BASE}/finance/daily", params={"pageSize": 3}, headers=h(ot))
d = r.json()
print("\n=== Operator1 finance daily (全局) ===")
print("code:", d.get("code"), "msg:", d.get("message"))
for r_ in (d.get("data") or {}).get("list", []):
    print("  -", r_.get("date"), r_.get("outletName"), "orders:", r_.get("totalOrders"), "net:", r_.get("netIncome"))

# Operator: global dashboard
r = requests.get(f"{BASE}/dashboard/global", headers=h(ot))
d = r.json().get("data", {})
print("\n=== Operator1 global dashboard ===")
print("totalTasks:", d.get("totalTasks"), "pending:", d.get("pending"), "exception:", d.get("exception"))
print("recentExceptions:", [(e.get("orderNo"), e.get("outletName"), e.get("status"), e.get("id")) for e in d.get("recentExceptions",[])])

# Operator: intervene on first exception
excs = d.get("recentExceptions", [])
if excs:
    eid = excs[0]["id"]
    print("\n=== Operator1 intervene mark_completed on", eid, "===")
    r = requests.post(f"{BASE}/tasks/{eid}/intervene", headers=h(ot), json={"action": "mark_completed", "reason": "平台运营测试干预"})
    print(r.json())

# Admin: bank cards
r = requests.get(f"{BASE}/finance/bank-cards", headers=h(at))
d = r.json().get("data", [])
print("\n=== Admin1 bank cards ===")
for c in d:
    print("  -", c.get("bankName"), c.get("cardNumber"), "isDefault:", c.get("isDefault"))

# Admin: threshold update
print("\n=== Admin1 update waybill threshold ===")
r = requests.put(f"{BASE}/waybill/threshold", headers=h(at), json={"threshold": 300})
print(r.json().get("code"), r.json().get("message"), "newThreshold:", (r.json().get("data") or {}).get("lowBalanceThreshold"))

# Courier越权: 尝试访问 finance (应 403)
print("\n=== Courier越权访问 finance ===")
r = requests.get(f"{BASE}/finance/overview", headers=h(ct))
print("code:", r.json().get("code"), "msg:", r.json().get("message"))

# Admin跨网点越权: 尝试访问另一个网点courier
# 先找非本网点courier id
r = requests.get(f"{BASE}/couriers", params={"pageSize": 100}, headers=h(ot))
all_couriers = (r.json().get("data") or {}).get("list", [])
other = [c for c in all_couriers if c.get("outletId") != json.loads(requests.get(f"{BASE}/couriers", headers=h(at), params={"pageSize":1}).text)["data"]["list"][0]["outletId"]]
if other:
    cid = other[0]["id"]
    print(f"\n=== Admin1 越权访问其他网点courier {cid} ===")
    r = requests.get(f"{BASE}/couriers/{cid}", headers=h(at))
    print("code:", r.json().get("code"), "msg:", r.json().get("message"))

print("\n=== All done ===")
