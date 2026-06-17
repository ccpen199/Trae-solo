#!/usr/bin/env python3
import json, urllib.request

BASE = "http://127.0.0.1:59218/api"
def req(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            t = resp.read().decode()
            return json.loads(t) if t.strip() else {}
    except Exception as e:
        return {"_err": str(e)[:200]}

def login(u,p): return req("POST","/auth/login",{"username":u,"password":p}).get("token","")

emp = login("employer1","123456")

print("="*70)
print("【用工订单列表 第1条】")
r = req("GET", "/labor-orders?page=1&limit=2", token=emp)
print("顶层keys:", list(r.keys()))
if r.get("orders"):
    o = r["orders"][0]
    print("订单keys:", list(o.keys()))
    print("title:", o.get("title"))
    print("status:", o.get("status"))
    print("employer_name:", o.get("employer_name"))
    print("employer_real_name:", o.get("employer_real_name"))
    print("total_price:", o.get("total_price"))
    print("price_per_hour:", o.get("price_per_hour"))
    print("city:", o.get("city"), "address:", o.get("address"))
    print("description:", (o.get("description") or "")[:50])
    lid = o.get("id")
    print()
    print("【用工订单详情 id="+lid+"】")
    d = req("GET", f"/labor-orders/{lid}", token=emp)
    print("详情keys:", list(d.keys()))
    for k in ["id","title","status","total_price","employer_name","employer_real_name","employer_phone","worker_name","worker_real_name","worker_phone","skills_required","description","sub_orders"]:
        if k in d:
            v = d[k]
            if isinstance(v, list): print(f"  {k}: (list {len(v)}项)")
            else: print(f"  {k}: {str(v)[:80]}")

print()
print("="*70)
print("【找车订单列表 第1条】")
r = req("GET", "/delivery-orders?page=1&limit=2", token=emp)
print("顶层keys:", list(r.keys()))
if r.get("orders"):
    o = r["orders"][0]
    print("订单keys:", list(o.keys()))
    for k in ["id","title","status","pickup_address","delivery_address","weight","volume","vehicle_type_required","bid_start_price","final_price","employer_name","waybill_no"]:
        if k in o: print(f"  {k}: {str(o[k])[:60]}")
    did = o.get("id")
    if did:
        print()
        print("【找车订单详情 id="+did+"】")
        d = req("GET", f"/delivery-orders/{did}", token=emp)
        print("详情keys:", list(d.keys()))
        for k in ["id","title","status","bids","driver_id","driver_name","employer_name","employer_real_name","employer_phone","vehicle_type_required","bid_start_price","final_price","waybill_no"]:
            if k in d:
                v = d[k]
                if isinstance(v, list): print(f"  {k}: (list {len(v)}项) {str(v[0])[:100] if v else ''}")
                else: print(f"  {k}: {str(v)[:80]}")

print()
print("="*70)
print("【搬家订单列表 第1条】")
r = req("GET", "/moving-orders?page=1&limit=2", token=emp)
print("顶层keys:", list(r.keys()))
if r.get("orders"):
    o = r["orders"][0]
    print("订单keys:", list(o.keys()))
    for k in list(o.keys())[:15]:
        print(f"  {k}: {str(o[k])[:60]}")
    mid = o.get("id")
    if mid:
        print()
        print("【搬家订单详情 id="+mid+"】")
        d = req("GET", f"/moving-orders/{mid}", token=emp)
        print("详情keys:", list(d.keys())[:30])
