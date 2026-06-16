#!/usr/bin/env python3
"""全链路业务验收测试脚本"""
import requests
import json

BASE = "http://127.0.0.1:49220/api"
LAT, LNG = 39.9939, 116.4778  # 望京

results = []

def check(name, condition, detail=""):
    status = "✅" if condition else "❌"
    results.append((status, name, detail))
    print(f"{status} {name}: {detail}")
    return condition

print("=" * 70)
print("  本地社区平台 - 全链路业务验收测试")
print("=" * 70)
print()

# ========== 1. 首页数据 ==========
print("📱 【首页数据验证】")
print("-" * 70)

try:
    r = requests.get(f"{BASE}/posts/feed", params={"latitude": LAT, "longitude": LNG, "limit": 25}, timeout=8)
    posts = r.json().get('posts', [])
    check("帖子Feed有数据", len(posts) > 0, f"{len(posts)}篇")
    
    source_levels = set(p['sourceLevel'] for p in posts)
    check("信源等级全覆盖", {'GOV', 'OFFICIAL', 'V', 'ORDINARY'}.issubset(source_levels),
          f"实际: {source_levels}")
    
    types = set(p['type'] for p in posts)
    check("帖子类型覆盖主要类型", len(types) >= 4, f"实际: {types}")
    
    has_pitfall = any(p.get('isPitfall') for p in posts)
    has_proof = any(p.get('hasProof') for p in posts)
    has_price = any(p.get('priceAnchor') for p in posts)
    check("有避坑帖", has_pitfall)
    check("有凭证帖", has_proof)
    check("有价格锚点", has_price)
    
    # 检查排序：GOV应该在前
    first_source = posts[0]['sourceLevel'] if posts else ''
    check("首条是高优先级信源", first_source in ['GOV', 'OFFICIAL'], f"首条: {first_source}")
    
except Exception as e:
    check("帖子Feed", False, str(e))

# 热门话题
try:
    r = requests.get(f"{BASE}/topics/hot", timeout=8)
    topics = r.json().get('topics', [])
    check("热门话题有数据", len(topics) >= 5, f"{len(topics)}个")
    
    with_posts = sum(1 for t in topics if t.get('postCount', 0) > 0)
    check("话题有帖子计数", with_posts >= 3, f"{with_posts}/{len(topics)}个有帖子")
    
    is_hot = sum(1 for t in topics if t.get('isHot'))
    check("热门标签标记正确", is_hot >= 3, f"{is_hot}个标记为热门")
except Exception as e:
    check("热门话题", False, str(e))

# 便民公告
try:
    r = requests.get(f"{BASE}/utilities/updates", params={"severity": 2, "limit": 5}, timeout=8)
    updates = r.json().get('updates', [])
    check("便民公告有数据", len(updates) >= 2, f"{len(updates)}条")
except Exception as e:
    check("便民公告", False, str(e))

print()

# ========== 2. 动态页筛选 ==========
print("📰 【动态页筛选验证】")
print("-" * 70)

filter_types = ['NOTICE', 'NEWS', 'REVIEW', 'ACTIVITY', 'INFO', 'EMERGENCY']
type_labels = {
    'NOTICE': '政务通知', 'NEWS': '本地资讯', 'REVIEW': '消费探店',
    'ACTIVITY': '商圈活动', 'INFO': '便民信息', 'EMERGENCY': '突发事件'
}

for t in filter_types:
    try:
        r = requests.get(f"{BASE}/posts/feed", params={"latitude": LAT, "longitude": LNG, "type": t, "limit": 10}, timeout=8)
        posts = r.json().get('posts', [])
        all_match = all(p['type'] == t for p in posts)
        check(f"筛选{type_labels[t]}({t})", len(posts) > 0 and all_match, f"{len(posts)}篇")
    except Exception as e:
        check(f"筛选{type_labels[t]}", False, str(e))

print()

# ========== 3. 商户页 ==========
print("🏪 【商户页验证】")
print("-" * 70)

try:
    r = requests.get(f"{BASE}/merchants/nearby", params={"latitude": LAT, "longitude": LNG, "radius": 5000}, timeout=8)
    merchants = r.json().get('merchants', [])
    check("5公里内有商户", len(merchants) >= 5, f"{len(merchants)}家")
    
    categories = set(m['category'] for m in merchants)
    check("商户分类覆盖", len(categories) >= 5, f"分类: {categories}")
    
    has_coupons = sum(1 for m in merchants if len(m.get('coupons', [])) > 0)
    check("商户有优惠券", has_coupons >= 5, f"{has_coupons}/{len(merchants)}家有券")
    
    has_distance = all(m.get('distance') is not None for m in merchants)
    check("LBS距离计算", has_distance)
except Exception as e:
    check("商户页", False, str(e))

print()

# ========== 4. 邻里互助 ==========
print("🤝 【邻里互助验证】")
print("-" * 70)

try:
    r = requests.get(f"{BASE}/help/requests", params={"latitude": LAT, "longitude": LNG}, timeout=8)
    helps = r.json().get('helpRequests', [])
    check("互助请求有数据", len(helps) >= 3, f"{len(helps)}条")
    
    types = set(h['type'] for h in helps)
    check("互助类型覆盖", len(types) >= 2, f"类型: {types}")
    
    has_responses = sum(1 for h in helps if len(h.get('responses', [])) > 0)
    check("互助有响应", has_responses >= 2, f"{has_responses}/{len(helps)}条有响应")
    
    has_emergency = any(h.get('urgency', 1) >= 3 for h in helps)
    check("有紧急求助", has_emergency)
except Exception as e:
    check("邻里互助", False, str(e))

print()

# ========== 5. 便民工具 ==========
print("🔧 【便民工具验证】")
print("-" * 70)

try:
    r = requests.get(f"{BASE}/utilities/services", timeout=8)
    services = r.json().get('services', [])
    check("便民服务类型", len(services) >= 3, f"{len(services)}类")
except Exception as e:
    check("便民服务", False, str(e))

try:
    r = requests.get(f"{BASE}/utilities/bus/stations", params={"latitude": LAT, "longitude": LNG}, timeout=8)
    stations = r.json().get('stations', [])
    check("公交站点", len(stations) >= 3, f"{len(stations)}个")
except Exception as e:
    check("公交站点", False, str(e))

try:
    r = requests.get(f"{BASE}/utilities/test-sites", params={"latitude": LAT, "longitude": LNG}, timeout=8)
    sites = r.json().get('sites', [])
    check("核酸检测点", len(sites) >= 3, f"{len(sites)}个")
except Exception as e:
    check("核酸检测点", False, str(e))

# 订阅
try:
    # 先登录获取token
    r = requests.post(f"{BASE}/auth/login", json={"phone": "13900000000", "password": "123456"}, timeout=8)
    token = r.json().get('token')
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{BASE}/utilities/subscriptions", headers=headers, timeout=8)
        subs = r.json().get('subscriptions', [])
        check("用户订阅", len(subs) >= 1, f"{len(subs)}条订阅")
    else:
        check("用户登录", False, "登录失败")
except Exception as e:
    check("订阅功能", False, str(e))

print()

# ========== 6. 后台管理 ==========
print("🛠️  【后台管理验证】")
print("-" * 70)

try:
    r = requests.post(f"{BASE}/auth/login", json={"phone": "13800000000", "password": "123456"}, timeout=8)
    admin_data = r.json()
    admin_token = admin_data.get('token')
    admin_user = admin_data.get('user')
    check("管理员登录", admin_token is not None and admin_user is not None,
          f"角色: {admin_user.get('role') if admin_user else '未知'}")
    
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 审核待办
        r = requests.get(f"{BASE}/admin/audit/pending", headers=headers, timeout=8)
        pending = r.json().get('posts', [])
        check("审核待办有数据", len(pending) >= 2, f"{len(pending)}条待审核")
        
        # 风险分布
        risk_levels = set(a.get('aiRiskLevel') for a in pending if a.get('aiRiskLevel'))
        check("风险等级多样", len(risk_levels) >= 2, f"等级: {risk_levels}")
        
        # 治理总览
        r = requests.get(f"{BASE}/admin/dashboard/overview", headers=headers, timeout=8)
        overview = r.json()
        stats = overview.get('stats', {})
        check("治理总览有数据", stats.get('postCount', 0) > 0,
              f"帖子:{stats.get('postCount')} 用户:{stats.get('userCount')}")
        
        # 热点聚类
        r = requests.get(f"{BASE}/admin/dashboard/hotspots", headers=headers, timeout=8)
        hotspots = r.json().get('topicClusters', [])
        check("热点聚类", len(hotspots) >= 3, f"{len(hotspots)}个热点")
        
except Exception as e:
    check("后台管理", False, str(e))

print()

# ========== 7. 商户效能 ==========
print("📊 【商户效能分析验证】")
print("-" * 70)

try:
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        first_merchant = merchants[0] if merchants else None
        if first_merchant:
            r = requests.get(f"{BASE}/admin/merchant/analytics/{first_merchant['id']}", headers=headers, timeout=8)
            analytics = r.json()
            has_data = analytics.get('merchant') is not None
            check("商户效能数据", has_data,
                  f"券:{analytics.get('totalCoupons')} 领取:{analytics.get('totalClaimed')} 核销:{analytics.get('totalUsed')}")
except Exception as e:
    check("商户效能", False, str(e))

print()

# ========== 汇总 ==========
print("=" * 70)
print("  验收汇总")
print("=" * 70)

passed = sum(1 for s, _, _ in results if s == "✅")
total = len(results)
print(f"\n通过: {passed}/{total} ({passed*100//total}%)")
print()

failed = [(n, d) for s, n, d in results if s == "❌"]
if failed:
    print("❌ 未通过项:")
    for name, detail in failed:
        print(f"   - {name}: {detail}")
else:
    print("🎉 全部验收通过！业务闭环完整！")

print()
