#!/usr/bin/env python3
import requests
import json

BASE = "http://127.0.0.1:49220/api"
LAT, LNG = 39.9042, 116.4074

results = {}

print("=" * 60)
print("通过前端代理验证首页数据")
print("=" * 60)

# 1. 帖子Feed
try:
    r = requests.get(f"{BASE}/posts/feed", params={"latitude": LAT, "longitude": LNG, "limit": 10}, timeout=8)
    d = r.json()
    posts = d.get('posts', [])
    results['posts'] = len(posts)
    print(f"\n✅ 帖子Feed: {len(posts)} 篇")
    if posts:
        types = set(p['type'] for p in posts)
        sources = set(p.get('sourceLevel', '?') for p in posts)
        has_pitfall = any(p.get('isPitfall') for p in posts)
        has_proof = any(p.get('hasProof') for p in posts)
        print(f"   类型: {types}")
        print(f"   信源: {sources}")
        print(f"   避坑帖: {has_pitfall}")
        print(f"   凭证帖: {has_proof}")
        print(f"   TOP3:")
        for p in posts[:3]:
            print(f"     [{p['type']}] {p['title'][:30]} | {p.get('sourceLevel','?')} | 🔥{round(p.get('hotScore',0))}")
except Exception as e:
    results['posts'] = 0
    print(f"\n❌ 帖子Feed失败: {e}")

# 2. 热门话题
try:
    r = requests.get(f"{BASE}/topics/hot", timeout=8)
    d = r.json()
    topics = d.get('topics', [])
    results['topics'] = len(topics)
    print(f"\n✅ 热门话题: {len(topics)} 个")
    if topics:
        hot_count = sum(1 for t in topics if t.get('isHot'))
        has_count = sum(1 for t in topics if t.get('postCount', 0) > 0)
        print(f"   isHot=True: {hot_count}")
        print(f"   有帖子数>0: {has_count}")
        for t in topics[:5]:
            print(f"     {t['name']} | postCount={t.get('postCount',0)} | heat={t.get('heatScore',0)}")
except Exception as e:
    results['topics'] = 0
    print(f"\n❌ 热门话题失败: {e}")

# 3. 便民公告
try:
    r = requests.get(f"{BASE}/utilities/updates", params={"severity": 2, "limit": 5}, timeout=8)
    d = r.json()
    updates = d.get('updates', [])
    results['updates'] = len(updates)
    print(f"\n✅ 便民公告(severity>=2): {len(updates)} 条")
    for u in updates[:3]:
        svc = u.get('service', {}) or {}
        print(f"     [{u.get('severity')}] {u['title'][:30]} | type={svc.get('type','?')}")
except Exception as e:
    results['updates'] = 0
    print(f"\n❌ 便民公告失败: {e}")

# 4. 商户附近
try:
    r = requests.get(f"{BASE}/merchants/nearby", params={"latitude": LAT, "longitude": LNG, "radius": 5000}, timeout=8)
    d = r.json()
    merchants = d.get('merchants', [])
    results['merchants'] = len(merchants)
    print(f"\n✅ 附近商户: {len(merchants)} 家")
    if merchants:
        cats = set(m['category'] for m in merchants)
        has_coupons = sum(1 for m in merchants if len(m.get('coupons', [])) > 0)
        print(f"   分类: {cats}")
        print(f"   有优惠券商户: {has_coupons}")
        for m in merchants[:3]:
            print(f"     {m['businessName'][:25]} | {m['category']} | 券{len(m.get('coupons',[]))}张 | {round(m.get('distance',0))}m")
except Exception as e:
    results['merchants'] = 0
    print(f"\n❌ 商户附近失败: {e}")

# 5. 互助列表
try:
    r = requests.get(f"{BASE}/help/requests", params={"latitude": LAT, "longitude": LNG}, timeout=8)
    d = r.json()
    helps = d.get('helpRequests', [])
    results['help'] = len(helps)
    print(f"\n✅ 互助请求: {len(helps)} 条")
    for h in helps[:3]:
        print(f"     [{h['type']}] {h['title'][:25]} | 紧急{h.get('urgency',1)} | 响应{len(h.get('responses',[]))}")
except Exception as e:
    results['help'] = 0
    print(f"\n❌ 互助失败: {e}")

# 6. 公交站点
try:
    r = requests.get(f"{BASE}/utilities/bus/stations", params={"latitude": LAT, "longitude": LNG}, timeout=8)
    d = r.json()
    stations = d.get('stations', [])
    results['bus'] = len(stations)
    print(f"\n✅ 公交站点: {len(stations)} 个")
    if stations:
        print(f"   {stations[0]['name']} | {len(stations[0].get('predictions',[]))}条线路预测")
except Exception as e:
    results['bus'] = 0
    print(f"\n❌ 公交站点失败: {e}")

# 7. 核酸检测点
try:
    r = requests.get(f"{BASE}/utilities/test-sites", params={"latitude": LAT, "longitude": LNG}, timeout=8)
    d = r.json()
    sites = d.get('sites', [])
    results['test'] = len(sites)
    print(f"\n✅ 核酸检测点: {len(sites)} 个")
except Exception as e:
    results['test'] = 0
    print(f"\n❌ 核酸检测点失败: {e}")

print("\n" + "=" * 60)
print("汇总: ", results)
print("=" * 60)
