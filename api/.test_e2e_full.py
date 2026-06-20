import requests, json

PROXY = "http://localhost:5174/api"

def test_login_flow(username, password, label):
    print(f"\n{'='*40}")
    print(f"Testing: {label} ({username})")
    print(f"{'='*40}")
    
    r = requests.post(PROXY + "/auth/login", json={"username": username, "password": password})
    d = r.json()
    if d["code"] != 200:
        print(f"  LOGIN FAILED: {d['message']}")
        return None
    token = d["data"]["token"]
    user = d["data"]["user"]
    print(f"  Login OK: {user['name']} ({user['role']}) outletId={user.get('outletId')}")
    
    h = {"Authorization": f"Bearer {token}"}
    
    r = requests.get(PROXY + "/auth/me", headers=h)
    d = r.json()
    print(f"  auth/me: {d['data']['name']} role={d['data']['role']}")
    
    r = requests.get(PROXY + "/dashboard", headers=h)
    d = r.json()
    if d["code"] == 200:
        data = d["data"]
        print(f"  Dashboard stats: pending={data['stats']['pending']} completed={data['stats']['completed']} exception={data['stats']['exception']}")
        print(f"  Alerts: {len(data.get('alerts',[]))} items → {[(a['level'],a['title']) for a in data.get('alerts',[])]}")
        print(f"  Recent tasks: {len(data.get('recentTasks',[]))} items")
    else:
        print(f"  Dashboard FAILED: {d['message']}")
    
    r = requests.get(PROXY + "/tasks", params={"pageSize": 3}, headers=h)
    d = r.json()
    if d["code"] == 200:
        print(f"  Tasks: total={d['data']['total']}")
        for t in d["data"]["list"]:
            print(f"    - {t['taskNo']} status={t['status']} courier={t.get('courierName')}")
    else:
        print(f"  Tasks FAILED: {d['message']}")
    
    return token

ct = test_login_flow("courier1", "courier123", "快递员")
at = test_login_flow("admin1", "admin123", "网点管理员")
ot = test_login_flow("operator1", "operator123", "平台运营")

if ot:
    h = {"Authorization": f"Bearer " + ot}
    print(f"\n{'='*40}")
    print("Operator-specific tests")
    print(f"{'='*40}")
    
    r = requests.get(PROXY + "/dashboard/global", headers=h)
    d = r.json()
    if d["code"] == 200:
        data = d["data"]
        print(f"  Global: totalTasks={data['totalTasks']} pending={data['pending']} exception={data['exception']}")
        excs = data.get("recentExceptions", [])
        print(f"  Exceptions: {len(excs)} items")
        if excs:
            eid = excs[0]["id"]
            print(f"  Intervene on {eid} (mark_completed)...")
            r = requests.post(PROXY + f"/tasks/{eid}/intervene", headers=h, json={"action":"mark_completed","reason":"测试干预"})
            print(f"    Result: {r.json()['code']} {r.json()['message']}")
    else:
        print(f"  Global FAILED: {d['message']}")

if at:
    h = {"Authorization": f"Bearer " + at}
    print(f"\n{'='*40}")
    print("Admin-specific tests")
    print(f"{'='*40}")
    
    r = requests.get(PROXY + "/finance/overview", headers=h)
    d = r.json()
    if d["code"] == 200:
        data = d["data"]
        print(f"  Finance: available={data['availableBalance']} frozen={data['frozenBalance']} total={data['totalBalance']}")
    else:
        print(f"  Finance FAILED: {d['message']}")
    
    r = requests.put(PROXY + "/waybill/threshold", headers=h, json={"threshold": 500})
    d = r.json()
    print(f"  Waybill threshold update: {d['code']} threshold={d.get('data',{}).get('lowBalanceThreshold')}")

print("\n=== All E2E tests done ===")
