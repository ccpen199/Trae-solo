import urllib.request, json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgxNzE5MjQ2LCJleHAiOjE3ODIzMjQwNDZ9.dDMmRj1wtZQL98NYvzswxYkGKAEZ7OeSr7iusDU-4hc"

def get(path):
    req = urllib.request.Request(f"http://127.0.0.1:59219{path}")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    return json.loads(urllib.request.urlopen(req).read())

def unpack(d):
    return d.get("data", d)

print("=" * 60)
print("📊 快递开放平台 - 端到端数据验证")
print("=" * 60)

# 1. Dashboard概览
print("\n1️⃣  Dashboard 运营概览")
r = unpack(get("/api/dashboard/overview"))
s = r.get("summary", {})
print(f"   总运单数: {s.get('total_orders')}")
print(f"   异常包裹: {s.get('exception_count')} (📌 钻取入口)")
print(f"   妥投率: {s.get('success_rate')}%")
print(f"   时效达标率: {s.get('on_time_rate')}%")
print(f"   今日订单: {s.get('today_orders')}")
print(f"   投诉数: {s.get('complaint_count')}")
print(f"   接入品牌: {s.get('total_brands')}")

# 2. 异常地址复核
print("\n2️⃣  异常地址预警 (realtime-map)")
r = unpack(get("/api/dashboard/realtime-map"))
abn = r.get("abnormal_addresses", [])
print(f"   异常地址数: {len(abn)}")
if abn:
    a = abn[0]
    print(f"   首条字段: tracking_no / status / review_status / review_note / reviewed_by / reviewed_at / abnormal_type")
    print(f"   样例: {a.get('tracking_no')} | {a.get('status')} | review_status={a.get('review_status')}")
    print(f"        abnormal_type={a.get('abnormal_type')} | brand={a.get('brand_name')}")

# 3. 异常运单队列
print("\n3️⃣  异常运单钻取队列 (orders?status=exception)")
r = unpack(get("/api/orders?status=exception&pageSize=5"))
l = r.get("list", [])
print(f"   总数: {r.get('total')} (与概览 {s.get('exception_count')} 条对比)")
print(f"   每页: {len(l)} 条")
if l:
    o = l[0]
    le = o.get("latest_event") or {}
    print(f"   首条: {o.get('tracking_no')}")
    print(f"        品牌: {o.get('brand_name')}")
    print(f"        地址异常: {o.get('is_address_abnormal')}")
    print(f"        最新轨迹: {str(le.get('event_desc', '无'))[:35]}")
    print(f"        通知数: {o.get('notification_count')}")

# 4. 品牌质量
print("\n4️⃣  品牌质量仪表盘")
r = unpack(get("/api/brands?pageSize=3"))
bl = r.get("list", [])
print(f"   品牌总数: {r.get('total')}")
print(f"   列表字段: name / code / base_price / rating / coverage_score / avg_delivery_hours")
for b in bl[:2]:
    print(f"   - {b.get('name')}  评级:{b.get('rating')}  覆盖率:{b.get('coverage_score')}  均价:¥{b.get('base_price')}")

r = unpack(get("/api/dashboard/brand-quality/1"))
print(f"\n   品牌详情(顺丰):")
print(f"        妥投率: {r.get('success_rate')}%  时效达标率: {r.get('on_time_rate')}%")
print(f"        投诉率: {r.get('complaint_rate')}%  异常率: {r.get('exception_rate')}%")
print(f"        趋势天数: {len(r.get('trend', []))} 天")
print(f"        近期运单: {len(r.get('recent_orders', []))} 条")

# 5. 网络拓扑
print("\n5️⃣  网络拓扑 / 吞吐量")
r = unpack(get("/api/branches/throughput-stats"))
print(f"   今日总吞吐量: {r.get('total_today')} 件")
print(f"   14天趋势: {len(r.get('daily_trend', []))} 天 (收件/派件 双曲线)")
print(f"   24小时分布: {len(r.get('hourly_today', []))} 小时")
print(f"   枢纽吞吐: {len(r.get('hub_throughput', []))} 个")
print(f"   城市分布: {len(r.get('by_city', []))} 城")
print(f"   过载网点: {len(r.get('overload_branches', []))} 个 (>85%)")

# 6. API开放中心-调用审计
print("\n6️⃣  开放接口中心 - 调用审计")
r = unpack(get("/api/dashboard/audit-logs?pageSize=3"))
al = r.get("list", [])
st = r.get("stats", {})
print(f"   总调用: {r.get('total')} 条")
print(f"   统计: total={st.get('total_calls')} success={st.get('success_calls')} rate={st.get('success_rate')}%")
print(f"   字段兼容: path/api_path / status/response_status / latency_ms/response_time")
if al:
    a = al[0]
    print(f"   首条: path={a.get('path') or a.get('api_path')}  status={a.get('status') or a.get('response_status')}  {a.get('latency_ms') or a.get('response_time')}ms  app={a.get('app_name')}")

# 7. 投诉SLA
print("\n7️⃣  投诉SLA管理")
r = unpack(get("/api/complaints?pageSize=3"))
cl = r.get("list", [])
print(f"   总投诉: {r.get('total')} 件")
print(f"   SLA_HOURS: 8")
print(f"   字段: sla_remaining_hours / sla_elapsed_hours / sla_progress / is_sla_expired")
if cl:
    c = cl[0]
    rem = c.get("sla_remaining_hours", "?")
    rem_str = f"{rem:.1f}h" if isinstance(rem, float) else str(rem)
    print(f"   首条: {c.get('tracking_no')}")
    print(f"        类型: {c.get('type')}  状态: {c.get('status')}")
    print(f"        SLA剩余: {rem_str}  超时: {c.get('is_sla_expired')}")
    print(f"        进度: {c.get('sla_progress')}%")

print("\n" + "=" * 60)
print("✅ 验证完成 - 7 大模块数据全部可达")
print("=" * 60)
