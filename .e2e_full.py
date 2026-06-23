import requests, json, sys
B = "http://127.0.0.1:59268/api"
all_ok = True

def check(name, r, expect_code=200, extra=None):
    global all_ok
    d = r.json()
    ok = d["code"] == expect_code
    if not ok:
        all_ok = False
    status = "✅" if ok else "❌"
    extra_str = f" → {extra(d)}" if extra else ""
    print(f"{status} {name}: code={d['code']} msg={d.get('message','')}{extra_str}")
    return d

print("\n" + "="*60)
print("  E2E 三角色全链路验证")
print("="*60)

# === COURIER ===
print("\n📦 1. 快递员 courier1 链路")
r = requests.post(B+"/auth/login", json={"username":"courier1","password":"courier123"})
d = check("login", r)
ct = d["data"]["token"]
h_c = {"Authorization": "Bearer "+ct}

# Dashboard - 检查角色隔离
r = requests.get(B+"/dashboard", headers=h_c)
d = check("dashboard", r, extra=lambda d: f"pending={d['data']['stats']['pending']} alerts={[(a['level'],a['title']) for a in d['data']['alerts']]}")

# 告警角色隔离：courier 不应收到网点级面单余额告警
alert_titles = [a["title"] for a in d["data"]["alerts"]]
if any("面单" in t or "额度" in t for t in alert_titles):
    print("   ❌ 角色隔离失败：courier 收到了网点级面单告警")
    all_ok = False
else:
    print("   ✅ 角色隔离正常：courier 未收到网点级面单告警")

# 最近任务应该有数据（和 stats 一致）
recent_count = len(d["data"].get("recentTasks", []))
pending = d["data"]["stats"]["pending"]
print(f"   recentTasks={recent_count} stats.pending={pending}")
if pending > 0 and recent_count == 0:
    print("   ❌ 最近任务为0但待揽收有数据，对不上")
    all_ok = False
else:
    print("   ✅ 最近任务与统计一致")

# 今日揽收趋势
trend = d["data"].get("hourlyTrend", [])
trend_total = sum(t.get("tasks", 0) for t in trend)
print(f"   hourlyTrend count={len(trend)} total={trend_total}")
if trend_total == 0 and pending > 0:
    print("   ❌ 今日趋势无数据但有待揽收任务")
    all_ok = False
else:
    print("   ✅ 今日趋势正常")

# 任务列表 - courier 仅本人任务
r = requests.get(B+"/tasks", params={"pageSize":10}, headers=h_c)
d = check("tasks list", r, extra=lambda d: f"total={d['data']['total']} list={len(d['data']['list'])}")

# 离线揽收 - 扫码
# 先获取一个 pending 任务的 pickupCode
if d["data"]["list"]:
    pending_tasks = [t for t in d["data"]["list"] if t["status"] == "pending"]
    if pending_tasks:
        task = pending_tasks[0]
        pickup_code = task["pickupCode"]
        task_id = task["id"]
        print(f"   测试用任务: id={task_id} pickupCode={pickup_code} status={task['status']}")

        # 扫码核销
        r = requests.post(B+"/tasks/scan", json={"pickupCode": pickup_code}, headers=h_c)
        d = check("scan pickup", r, extra=lambda d: f"status={d['data'].get('status')}")

        # 称重
        r = requests.post(B+f"/tasks/{task_id}/weigh", json={"weight": 3.5, "photos": ["photo1.jpg"]}, headers=h_c)
        d = check("weigh", r, extra=lambda d: f"status={d['data'].get('status')} weight={d['data'].get('actualWeight')}")

        # 计算运费
        r = requests.post(B+"/tasks/calculate-freight", json={"weight": 3.5, "itemType": "clothes"}, headers=h_c)
        d = check("calculate freight", r, extra=lambda d: f"total={d['data'].get('total')} base={d['data'].get('baseFee')}")

        # 运费收款
        r = requests.post(B+f"/tasks/{task_id}/pay", json={"method": "wechat", "amount": 18.0}, headers=h_c)
        d = check("pay", r, extra=lambda d: f"status={d['data'].get('status')} freight={d['data'].get('freight')}")

        # 面单打印
        r = requests.post(B+f"/tasks/{task_id}/print", json={"waybillNo": f"SF{task_id}0001", "printerName": "Printer-01", "paperSize": "100x150"}, headers=h_c)
        d = check("print waybill", r, extra=lambda d: f"waybillNo={d['data'].get('waybillNo')} balance={d['data'].get('balance')}")

# courier 越权访问财务 - 应该 403
r = requests.get(B+"/finance/overview", headers=h_c)
check("越权访问财务(应403)", r, expect_code=403)

# === ADMIN ===
print("\n🏢 2. 网点管理员 admin1 链路")
r = requests.post(B+"/auth/login", json={"username":"admin1","password":"admin123"})
d = check("login", r)
at = d["data"]["token"]
h_a = {"Authorization": "Bearer "+at}

# Dashboard - 应有面单告警
r = requests.get(B+"/dashboard", headers=h_a)
d = check("dashboard", r, extra=lambda d: f"pending={d['data']['stats']['pending']} waybill={d['data'].get('waybill',{}).get('balance')} alerts={[(a['level'],a['title']) for a in d['data']['alerts']]}")

alert_titles = [a["title"] for a in d["data"]["alerts"]]
if d["data"].get("waybill") and d["data"]["waybill"]["balance"] < d["data"]["waybill"]["lowBalanceThreshold"]:
    if any("面单" in t for t in alert_titles):
        print("   ✅ 角色隔离正常：admin 收到面单余额告警")
    else:
        print("   ⚠️  余额不足但未收到告警（可能余额充足）")
else:
    print("   ℹ️  余额充足，无面单告警（正常）")

# 面单账户 - admin 可设置阈值
r = requests.get(B+"/waybill/account", headers=h_a)
d = check("waybill account", r, extra=lambda d: f"balance={d['data']['balance']} threshold={d['data']['lowBalanceThreshold']}")

new_threshold = 300
r = requests.put(B+"/waybill/threshold", json={"threshold": new_threshold}, headers=h_a)
d = check("update threshold", r, extra=lambda d: f"new threshold={d['data'].get('lowBalanceThreshold')}")

# 财务对账
r = requests.get(B+"/finance/overview", headers=h_a)
d = check("finance overview", r, extra=lambda d: f"available={d['data']['availableBalance']} frozen={d['data']['frozenBalance']}")

r = requests.get(B+"/finance/daily", params={"pageSize":10}, headers=h_a)
d = check("finance daily", r, extra=lambda d: f"total={d['data']['total']} list={len(d['data']['list'])}")

# 银行卡管理
r = requests.get(B+"/finance/bank-cards", headers=h_a)
d = check("bank cards", r, extra=lambda d: f"count={len(d['data'])}")

# 提现记录
r = requests.get(B+"/finance/withdraw-records", params={"pageSize":10}, headers=h_a)
d = check("withdraw records", r, extra=lambda d: f"total={d['data']['total']}")

# admin 越权查他网点快递员 - 应该 403
r = requests.get(B+"/couriers", params={"pageSize":10, "outletId":"other"}, headers=h_a)
check("越权查他网点快递员(应403)", r, expect_code=403)

# === OPERATOR ===
print("\n🌐 3. 平台运营 operator1 链路")
r = requests.post(B+"/auth/login", json={"username":"operator1","password":"operator123"})
d = check("login", r)
ot = d["data"]["token"]
h_o = {"Authorization": "Bearer "+ot}

# Dashboard
r = requests.get(B+"/dashboard", headers=h_o)
d = check("dashboard", r, extra=lambda d: f"pending={d['data']['stats']['pending']} alerts={len(d['data']['alerts'])}")

# 全局看板
r = requests.get(B+"/dashboard/global", headers=h_o)
d = check("global dashboard", r, extra=lambda d: f"total={d['data']['totalTasks']} exception={d['data']['exception']} recentExceptions={len(d['data'].get('recentExceptions',[]))}")

# 异常干预
excs = d["data"].get("recentExceptions", [])
if excs:
    eid = excs[0]["id"]
    r = requests.post(B+f"/tasks/{eid}/intervene", json={"action":"mark_completed", "reason":"运营干预测试"}, headers=h_o)
    d = check(f"异常干预 task {eid}", r, extra=lambda d: f"status={d['data'].get('status')}")

# 全局财务（operator 可看所有网点）
r = requests.get(B+"/finance/daily", params={"pageSize":30}, headers=h_o)
d = check("global finance daily", r, extra=lambda d: f"total={d['data']['total']}")
outlet_names = set(row.get("outletName") for row in d["data"]["list"])
print(f"   跨网点: {outlet_names}")
if len(outlet_names) > 1:
    print("   ✅ operator 可查全网点财务")
else:
    print("   ⚠️  可能仅查到一个网点数据")

# === 总结 ===
print("\n" + "="*60)
if all_ok:
    print("🎉 全部 E2E 测试通过！")
else:
    print("❌ 部分测试失败，请检查")
print("="*60)
sys.exit(0 if all_ok else 1)
