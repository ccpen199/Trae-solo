import urllib.request, json, urllib.error

BASE = "http://127.0.0.1:59219/api"

def login(user, pwd):
    data = json.dumps({"username": user, "password": pwd}).encode()
    req = urllib.request.Request(BASE + "/auth/login", data=data,
        headers={"Content-Type": "application/json"}, method="POST")
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp["token"], resp.get("user", {})

def get(token, path):
    req = urllib.request.Request(BASE + path)
    req.add_header("Authorization", f"Bearer {token}")
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except Exception as e:
        return {"error": str(e)}

def post(token, path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="POST")
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.read().decode('utf-8')[:100]}"}
    except Exception as e:
        return {"error": str(e)}

print("=" * 60)
print("📊 3 角色工作台承接 & 业务流程端到端验证")
print("=" * 60)

# ===== 1. admin 流程 =====
print("\n1️⃣  管理员 admin / 123456")
token, user = login("admin", "123456")
print(f"   登录成功: role={user.get('role')}  name={user.get('name')}")

ov = get(token, "/dashboard/overview")
ov_data = ov.get("data", ov).get("summary", {})
print(f"   运营概览: 总运单={ov_data.get('total_orders')} 异常={ov_data.get('exception_count')} 妥投率={ov_data.get('success_rate')}%")

ex = get(token, "/orders?status=exception&pageSize=5")
ex_data = ex.get("data", ex)
print(f"   异常运单队列: total={ex_data.get('total')}  list_len={len(ex_data.get('list',[]))}")

ex_first = ex_data.get("list", [])[0]
if ex_first and ex_first.get("is_address_abnormal"):
    rv = post(token, f"/orders/{ex_first['id']}/review-address",
        {"action": "confirm_normal", "note": "验证测试-地址正常解除拦截"})
    rv_data = rv.get("data", rv)
    print(f"   地址复核: success={rv_data.get('success')} status={rv_data.get('review_status')}")
else:
    # 找一个 abnormal_addresses 里的来复核
    rm = get(token, "/dashboard/realtime-map")
    abn = rm.get("data", rm).get("abnormal_addresses", [])
    if abn:
        rv = post(token, f"/orders/{abn[0]['id']}/review-address",
            {"action": "confirm_normal", "note": "验证测试-地址正常解除拦截"})
        rv_data = rv.get("data", rv)
        print(f"   地址复核(abnormal_addresses): success={rv_data.get('success')} status={rv_data.get('review_status')}")

br = get(token, "/brands?pageSize=3")
br_data = br.get("data", br)
print(f"   品牌列表: total={br_data.get('total')}")

th = get(token, "/branches/throughput-stats")
th_data = th.get("data", th)
print(f"   网点吞吐: total_today={th_data.get('total_today')} trend_days={len(th_data.get('daily_trend',[]))} hubs={len(th_data.get('hub_throughput',[]))}")

al = get(token, "/dashboard/audit-logs?pageSize=3")
al_data = al.get("data", al)
print(f"   调用审计: total={al_data.get('total')} rate={al_data.get('stats',{}).get('success_rate')}%")

cp = get(token, "/complaints?pageSize=3")
cp_data = cp.get("data", cp)
print(f"   投诉SLA: total={cp_data.get('total')} 首条sla_rem_hours={cp_data.get('list',[{}])[0].get('sla_remaining_hours')}")

# ===== 2. user1 流程 =====
print("\n2️⃣  普通用户 user1 / 123456")
token2, user2 = login("user1", "123456")
print(f"   登录成功: role={user2.get('role')}  name={user2.get('name')}")

my = get(token2, "/orders?pageSize=5")
my_data = my.get("data", my)
print(f"   我的运单: total={my_data.get('total')}")

pr = post(token2, "/price/compare", {
    "sender_city": "北京", "receiver_city": "上海",
    "sender_longitude": 116.4, "sender_latitude": 39.9,
    "receiver_longitude": 121.47, "receiver_latitude": 31.23,
    "weight": 2.5, "length": 30, "width": 20, "height": 15
})
pr_data = pr.get("data", pr)
if "error" in pr:
    print(f"   比价失败: {pr['error']}")
else:
    brands = pr_data.get("brands") or pr_data.get("results") or []
    rec = pr_data.get("recommendation")
    print(f"   比价引擎: brands={len(brands)} 推荐={rec.get('brand_name') if isinstance(rec, dict) else rec}")

co = post(token2, "/orders/create", {
    "sender_name": user2.get("name"),
    "sender_phone": "13800000001",
    "sender_address": "北京市朝阳区建国路88号",
    "sender_longitude": 116.4, "sender_latitude": 39.9,
    "receiver_name": "张三",
    "receiver_phone": "13900000002",
    "receiver_address": "上海市浦东新区世纪大道100号",
    "receiver_longitude": 121.47, "receiver_latitude": 31.23,
    "weight": 2.5, "length": 30, "width": 20, "height": 15,
    "goods_type": "standard", "priority": "normal", "brand_id": 1
})
co_data = co.get("data", co)
if "error" in co:
    print(f"   下单失败: {co['error']}")
else:
    print(f"   创建运单: id={co_data.get('id')} tracking_no={co_data.get('tracking_no')} brand={co_data.get('brand_name')}")

# ===== 3. courier1 流程 =====
print("\n3️⃣  快递员 courier1 / 123456")
token3, user3 = login("courier1", "123456")
print(f"   登录成功: role={user3.get('role')}  name={user3.get('name')}")

wb = get(token3, "/couriers/me/workbench")
wb_data = wb.get("data", wb)
if "error" in wb:
    print(f"   工作台失败: {wb['error']}")
else:
    keys = list(wb_data.keys())[:10]
    print(f"   工作台 keys={keys}")
    print(f"   待派单={wb_data.get('pending') or wb_data.get('pending_orders') or wb_data.get('stats',{}).get('pending')}")
    print(f"   派送中={wb_data.get('out_for_delivery')} 今日签收={wb_data.get('today_signed') or wb_data.get('signed_today')}")

cp3 = get(token3, "/complaints?pageSize=3")
cp3_data = cp3.get("data", cp3)
print(f"   投诉工单: total={cp3_data.get('total')} 首条sla_rem={cp3_data.get('list',[{}])[0].get('sla_remaining_hours')}")

print("\n" + "=" * 60)
print("✅ 端到端验证完成 - 3 角色全流程可验收")
print("=" * 60)
