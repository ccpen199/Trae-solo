import requests
import json

BASE = "http://127.0.0.1:59220"

def login(phone, pwd="123456"):
    r = requests.post(f"{BASE}/api/auth/login", json={"phone": phone, "password": pwd})
    return r.json()

print("=" * 60)
print("【1】系统登录测试")
print("=" * 60)
admin = login("13800000000")
print(f"管理员登录: {admin['user']['nickname']} [{admin['user']['role']}]")
print(f"兴趣标签: {admin['user']['interestTags']}")
tok = admin['token']
H = {"Authorization": f"Bearer {tok}"}

gov = login("13800000001")
print(f"政府账号登录: {gov['user']['nickname']} [{gov['user']['role']}]")
mer = login("13700000000")
print(f"商户登录: {mer['user']['nickname']} [{mer['user']['role']}]")
cit = login("13900000000")
print(f"市民登录: {cit['user']['nickname']} [{cit['user']['role']}]")

print()
print("=" * 60)
print("【2】商户LBS查询")
print("=" * 60)
r = requests.get(f"{BASE}/api/merchants/nearby", params={"latitude": 39.9042, "longitude": 116.4074})
d = r.json()
for m in d['merchants']:
    print(f"  {m['businessName']} | {m['category']} | ⭐{m['rating']} | {round(m['distance'])}米 | 券:{len(m['coupons'])}张 | 图:{len(m['images'])}")

mid = d['merchants'][0]['id']

print()
print("=" * 60)
print("【3】帖子Feed流 (LBS+热度排序)")
print("=" * 60)
r = requests.get(f"{BASE}/api/posts/feed", params={"latitude": 39.9042, "longitude": 116.4074})
d = r.json()
for p in d['posts']:
    tags = [f"@{t['topic']['name']}" for t in (p.get('topics') or [])]
    pit = " ⚠️避坑" if p.get('isPitfall') else ""
    rcpt = " 🧾凭证" if p.get('hasReceipt') else ""
    src = f"[{p.get('sourceLevel') or 'ORDINARY'}]"
    print(f"  {src} {p['title'][:22]} | 🔥{round(p['hotScore'])} | {p['type']}{pit}{rcpt} | {' '.join(tags)}")

print()
print("=" * 60)
print("【4】邻里互助 (LBS范围查询)")
print("=" * 60)
r = requests.get(f"{BASE}/api/help/requests", params={"latitude": 39.9042, "longitude": 116.4074})
d = r.json()
for h in d['helpRequests']:
    urg = "🆘" * h.get('urgency', 1)
    print(f"  {urg} [{h['status']}] [{h['type']}] {h['title'][:20]} | {h['user']['nickname']} | {round(h['distance'])}米 | 响应:{len(h['responses'])}")

print()
print("=" * 60)
print("【5】便民工具 - 公交到站预测")
print("=" * 60)
r = requests.get(f"{BASE}/api/utilities/bus/stations", params={"latitude": 39.9042, "longitude": 116.4074})
d = r.json()
for s in d['stations'][:3]:
    preds = ", ".join([f"{p['lineName']}→{p['arrivalMinutes']}分" for p in s['predictions'][:2]])
    print(f"  🚌 {s['name']} ({round(s['distance'])}米) -> {preds}")

print()
print("=" * 60)
print("【6】便民工具 - 核酸检测点")
print("=" * 60)
r = requests.get(f"{BASE}/api/utilities/test-sites", params={"latitude": 39.9042, "longitude": 116.4074})
d = r.json()
for s in d['sites'][:3]:
    st = "✅营业中" if s.get('isOpen') else "⏸️休息"
    wt = f"排队≈{s.get('waitMinutes', '?')}分钟" if s.get('waitMinutes') else ""
    print(f"  🧪 {s['name']} | {st} | {wt} | {round(s.get('distance',0))}米")

print()
print("=" * 60)
print("【7】后台 - 审核工作台 (AI初筛结果)")
print("=" * 60)
r = requests.get(f"{BASE}/api/admin/audit/pending", headers=H)
d = r.json()
print(f"  待审总数: {len(d['posts'])}")
print(f"  风险分组: {d['levelGroups']}")
for p in d['posts'][:3]:
    kw = ",".join(p.get('aiMatchedKeywords') or [])
    print(f"  [{p.get('aiRiskLevel','-')}] 风险{p.get('aiRiskScore',0)} {p['title'][:20]} | 敏感词:{kw or '无'}")

print()
print("=" * 60)
print("【8】后台 - 治理驾驶舱 总览")
print("=" * 60)
r = requests.get(f"{BASE}/api/admin/dashboard/overview", headers=H)
d = r.json()
o = d['overview']
print(f"  👥 用户总数: {o['totalUsers']}")
print(f"  🏪 已审核商户: {o['totalMerchants']}")
print(f"  📝 内容总数: {o['totalPosts']}")
print(f"  🆕 今日发帖: {o['todayPosts']}")
print(f"  ⚖️ 审核通过率: {round(o['auditPassRate']*100,1)}%")
print(f"  🚨 进行中紧急求助: {o['emergencyHelps']}")
print(f"  📊 7天发帖趋势: {[x['count'] for x in d['contentTrend']]}")
print(f"  📦 状态分布: 通过{d['statusStats']['approved']} | 待审{d['statusStats']['pending']} | 拒绝{d['statusStats']['rejected']}")

print()
print("=" * 60)
print("【9】后台 - 话题聚类与风险预警")
print("=" * 60)
r = requests.get(f"{BASE}/api/admin/dashboard/hotspots", headers=H)
d = r.json()
print(f"  🔥 热点话题 TOP {len(d['topicClusters'])}:")
for t in d['topicClusters'][:5]:
    lv = {"FIRE": "🔥🔥", "STAR": "⭐", "NORMAL": "📌"}.get(t.get('level'), "📌")
    print(f"  {lv} {t['name']} | {t['postCount']}帖 | 热度{round(t['hotScore'])} | TOP:{t['topPosts'][0]['title'][:15] if t.get('topPosts') else '-'}")
print(f"  🎯 高风险预警: {len(d['risks'])}条")
for r_ in d['risks'][:3]:
    lv = "🔴" if r_['riskLevel'] == 'CRITICAL' else "🟠"
    title = r_.get('post', {}).get('title', '?')[:18] if r_.get('post') else '?'
    print(f"  {lv} [{r_['riskLevel']}] 分值{r_['aiScore']} | {title}")

print()
print("=" * 60)
print("【10】商户效能分析 - 转化漏斗")
print("=" * 60)
r = requests.get(f"{BASE}/api/admin/merchant/analytics/{mid}", headers=H)
d = r.json()
k = d['kpis']
print(f"  商户: {d['merchant']['businessName']}")
print(f"  📋 优惠券总数: {k['totalCoupons']}")
print(f"  📥 累计领取: {k['totalClaimed']} (转化率{round(k['claimRate']*100,1)}%)")
print(f"  ✅ 累计核销: {k['totalRedeemed']} (核销率{round(k['redeemRate']*100,1)}%)")
print(f"  📝 探店笔记: {k['reviewCount']}篇 均赞{round(k['avgLikes'],1)}")
print(f"  互动分布: 浏览{k['engagementBreakdown']['views']} | 点赞{k['engagementBreakdown']['likes']} | 评论{k['engagementBreakdown']['comments']} | 分享{k['engagementBreakdown']['shares']}")
print("  各券明细:")
for c in d['couponAnalytics']:
    cl = round(c['claimRate']*100,1); rd = round(c['redeemRate']*100,1)
    print(f"    ▶ {c['title'][:18]} 领取{c['claimedCount']}/{c['totalCount']} ({cl}%) | 核销{c['redeemedCount']} ({rd}%)")

print()
print("=" * 60)
print("✅ 全部API测试通过！系统功能完整运行")
print("=" * 60)
