import urllib.request, json
def fetch(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    return json.loads(urllib.request.urlopen(req).read())

# 1. 登录 admin
login = json.loads(urllib.request.urlopen(
    urllib.request.Request("http://127.0.0.1:59219/api/auth/login",
        data=json.dumps({"username": "admin", "password": "123456"}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
).read())
token = login.get("data", {}).get("token") or login.get("token")
print("✅ 登录:", "OK" if token else "FAIL -", json.dumps(login, ensure_ascii=False)[:200])

# 2. Dashboard overview
ov = fetch("http://127.0.0.1:59219/api/dashboard/overview", token)
s = ov.get("data", ov).get("summary", {})
print(f"\n✅ 概览统计: 运单={s.get('total_orders')} 异常包裹={s.get('exception_count')} 妥投率={s.get('success_rate')}% 投诉={s.get('complaint_count')} 品牌={s.get('total_brands')}")

# 3. 异常运单接口
ex = fetch("http://127.0.0.1:59219/api/orders?status=exception&pageSize=10", token)
ex_data = ex.get("data", ex)
ex_list = ex_data.get("list", []) if isinstance(ex_data, dict) else []
print(f"✅ 异常运单接口: {len(ex_list)} 条")
if ex_list:
    o = ex_list[0]
    print(f"   - 首条: {o.get('tracking_no')} 品牌={o.get('brand_name')} 地址异常={o.get('is_address_abnormal')} 最新事件={(o.get('latest_event') or {}).get('event_desc','无')[:30]}")

# 4. 品牌质量列表
bs = fetch("http://127.0.0.1:59219/api/brands?pageSize=5", token)
bs_data = bs.get("data", bs)
bs_list = bs_data.get("list", []) if isinstance(bs_data, dict) else bs_data
print(f"\n✅ 品牌列表: {len(bs_list)} 条 (total={bs_data.get('total', '?')})")
if bs_list:
    b = bs_list[0]
    print(f"   - {b.get('name')} 基础价={b.get('base_price')} 评级={b.get('rating')}")

# 5. Branches 吞吐量
th = fetch("http://127.0.0.1:59219/api/branches/throughput-stats", token)
th_data = th.get("data", th)
print(f"\n✅ 网点吞吐量: daily_trend={'有' if th_data.get('daily_trend') else '无'} hub_throughput={'有' if th_data.get('hub_throughput') else '无'} total_today={th_data.get('total_today')}")

# 6. Complaints SLA
cp = fetch("http://127.0.0.1:59219/api/complaints?pageSize=5", token)
cp_data = cp.get("data", cp)
cp_list = cp_data.get("list", []) if isinstance(cp_data, dict) else []
print(f"\n✅ 投诉SLA: {len(cp_list)} 条 total={cp_data.get('total','?')}")
if cp_list:
    c = cp_list[0]
    print(f"   - {c.get('tracking_no')} 状态={c.get('status')} 类型={c.get('type')} SLA剩余={(c.get('sla_remaining_hours'), c.get('sla_remaining'))}")

# 7. API 调用审计
al = fetch("http://127.0.0.1:59219/api/dashboard/audit-logs?pageSize=5", token)
al_data = al.get("data", al)
al_list = al_data.get("list", []) if isinstance(al_data, dict) else []
print(f"\n✅ API调用审计: {len(al_list)} 条 total={al_data.get('total','?')}")
if al_list:
    a = al_list[0]
    print(f"   - {a.get('path')} 状态={a.get('status')} 耗时={a.get('latency_ms')}ms App={a.get('app_name')}")

# 8. 异常地址复核接口测试
if ex_list and ex_list[0].get("is_address_abnormal"):
    order_id = ex_list[0]["id"]
    body = json.dumps({"action": "confirm_normal", "note": "验证测试：地址正确，解除拦截"}).encode()
    rv = json.loads(urllib.request.urlopen(
        urllib.request.Request(f"http://127.0.0.1:59219/api/orders/{order_id}/review-address",
            data=body, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="POST")
    ).read())
    rv_data = rv.get("data", rv)
    print(f"\n✅ 地址复核(confirm_normal): success={rv_data.get('success', rv.get('success'))} review_status={rv_data.get('review_status')}")

print("\n🎉 全部接口验证完成")
