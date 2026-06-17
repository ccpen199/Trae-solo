#!/usr/bin/env python3
import urllib.request, json, sys

BASE = "http://127.0.0.1:59219/api"

def post(path, body, token=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type":"application/json"})
    if token: req.add_header("Authorization", f"Bearer {token}")
    return json.loads(urllib.request.urlopen(req).read())

def get(path, token=None):
    req = urllib.request.Request(BASE + path)
    if token: req.add_header("Authorization", f"Bearer {token}")
    return json.loads(urllib.request.urlopen(req).read())

# 1. Admin login
r = post("/auth/login", {"username":"admin","password":"123456"})
token = r["token"]
user = r["user"]
print(f"✅ Admin 登录: {user['name']} / {user['role']}")

# 2. User1 login  
r2 = post("/auth/login", {"username":"user1","password":"123456"})
token_u = r2["token"]
print(f"✅ User1 登录: {r2['user']['name']} / {r2['user']['role']}")

# 3. Courier1 login
r3 = post("/auth/login", {"username":"courier1","password":"123456"})
token_c = r3["token"]
print(f"✅ Courier1 登录: {r3['user']['name']} / {r3['user']['role']}")

# 4. Orders list + latest_event
orders = get("/orders?pageSize=3", token)
print(f"\n✅ 运单列表 total={orders['total']}")
o = orders["list"][0]
le = o.get("latest_event")
print(f"  首单 {o['tracking_no']} brand={o.get('brand_name')} status={o['status']}")
print(f"  latest_event: {le.get('event_type') if isinstance(le, dict) else le} | desc={(le or {}).get('event_desc')[:30] if isinstance(le, dict) else 'N/A'}")
print(f"  notification_count: {o.get('notification_count')}")

# 5. Orders stats
stats = get("/orders/stats/summary", token)
print(f"\n✅ 运单统计: {stats}")

# 6. Notifications unread count (admin)
unread_admin = get("/notifications/unread-count", token)
print(f"✅ Admin未读通知: {unread_admin}")

# Notifications unread count (user1)
unread_u = get("/notifications/unread-count", token_u)
print(f"✅ User1未读通知: {unread_u}")

# 7. Dashboard overview
ov = get("/dashboard/overview")
s = ov["summary"]
print(f"\n✅ 运营概览 today_orders={s.get('today_orders')}, today_revenue={s.get('today_revenue')}, on_time_rate={s.get('on_time_rate')}%, total_orders={s.get('total_orders')}, exception={s.get('exception_count')}")

# 8. Realtime-map abnormal addresses
rm = get("/dashboard/realtime-map")
ab = rm.get("abnormal_addresses", [])
print(f"\n✅ 异常地址预警: {len(ab)} 条")
if ab:
    a = ab[0]
    print(f"  示例: id={a['id']}, tracking={a['tracking_no']}, review_status={a.get('review_status')}, reviewed_by={a.get('reviewed_by')}, abnormal_type={a.get('abnormal_type')}, brand={a.get('brand_name')}")

# 9. API usage
au = get("/dashboard/api-usage")
s2 = au.get("summary", {})
print(f"\n✅ API调用统计 summary={s2}")
print(f"   apps={len(au.get('apps', []))}, trend_dates={len(au.get('trend',{}).get('dates',[]))}")

# 10. Order detail + notifications + events
oid = orders["list"][0]["id"]
detail = get(f"/orders/{oid}", token)
print(f"\n✅ 运单详情 id={oid}")
print(f"   events 条数: {len(detail.get('events', []))}")
print(f"   notifications 条数: {len(detail.get('notifications', []))}")
if detail.get("events"):
    ev = detail["events"][0]
    print(f"   首条event: type={ev.get('event_type')}, desc={str(ev.get('event_desc'))[:30]}")

# 11. Courier workbench
wb = get("/couriers/me/workbench", token_c)
st = wb.get("stats", {})
print(f"\n✅ 快递员工作台: {wb.get('courier',{}).get('name')}")
print(f"   待派单={st.get('pending_orders')}, 派送中={st.get('out_for_delivery')}, 今日签收={st.get('today_signed')}, SLA预警={st.get('sla_warning')}")

# 12. 尝试错误密码 - 验证错误分类
print("\n=== 错误分类验证 ===")
import urllib.error
try:
    post("/auth/login", {"username":"admin","password":"wrong123"})
except urllib.error.HTTPError as e:
    body = json.loads(e.read())
    print(f"❌ 错误密码 -> HTTP {e.code}: {body}")

try:
    post("/auth/login", {"username":"","password":""})
except urllib.error.HTTPError as e:
    body = json.loads(e.read())
    print(f"❌ 空账号 -> HTTP {e.code}: {body}")

try:
    post("/auth/login", {"username":"!@#中文账号","password":"123456"})
except urllib.error.HTTPError as e:
    body = json.loads(e.read())
    print(f"❌ 非法格式 -> HTTP {e.code}: {body}")

print("\n🎉 全部验证完成")
