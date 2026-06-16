#!/bin/bash
BASE=http://127.0.0.1:59220

echo "=== 登录管理员 ==="
RESP=$(curl -s $BASE/api/auth/login -X POST -H "Content-Type: application/json" -d '{"phone":"13800000000","password":"123456"}')
TOKEN=$(python3 -c "import json; print(json.loads('''$RESP''')['token'])")
echo "Token获取成功"

echo ""
echo "=== 审核待审列表 ==="
DATA=$(curl -s $BASE/api/admin/audit/pending -H "Authorization: Bearer $TOKEN")
python3 -c "
import json
d = json.loads('''$DATA''')
print('待审帖子:', len(d['posts']))
print('风险分级统计:', d['levelGroups'])
if d['posts']:
    p = d['posts'][0]
    print('首帖:', p['title'][:25])
    print('风险等级:', p.get('aiRiskLevel'))
    print('匹配敏感词:', p.get('aiMatchedKeywords'))
"

echo ""
echo "=== 治理总览 ==="
DATA=$(curl -s $BASE/api/admin/dashboard/overview -H "Authorization: Bearer $TOKEN")
python3 -c "
import json
d = json.loads('''$DATA''')
o = d['overview']
print(f'用户数: {o[\"totalUsers\"] | 商户: {o[\"totalMerchants\"] | 内容: {o[\"totalPosts\"]}')
print(f'今日发帖: {o[\"todayPosts\"]} | 通过率: {round(o[\"auditPassRate\"]*100,1)}% | 紧急求助: {o[\"emergencyHelps\"]}')
print('7天趋势:', [x['count'] for x in d['contentTrend']])
print('状态分布:', d['statusStats'])
print('风险帖子数:', len(d['riskPosts']))
"

echo ""
echo "=== 热点聚类 ==="
DATA=$(curl -s $BASE/api/admin/dashboard/hotspots -H "Authorization: Bearer $TOKEN")
python3 -c "
import json
d = json.loads('''$DATA''')
print('话题聚类数:', len(d['topicClusters']))
for t in d['topicClusters'][:4]:
    print(f\"  {t['name']: {t['level']} 帖子数={t['postCount']} 热度={round(t['hotScore'],1)}")
print('风险预警数:', len(d['risks']))
"

echo ""
echo "=== 商户效能 ==="
MERID=$(curl -s "$BASE/api/merchants/nearby?latitude=39.9042&longitude=116.4074" | python3 -c "import json,sys; print(json.load(sys.stdin)['merchants'][0]['id']")
echo "分析商户ID:", $MERID
DATA=$(curl -s $BASE/api/admin/merchant/analytics/$MERID -H "Authorization: Bearer $TOKEN")
python3 -c "
import json
d = json.loads('''$DATA''')
k = d['kpis']
print(f'券总数: {k[\"totalCoupons\"]} | 领取: {k[\"totalClaimed\"]} | 核销: {k[\"totalRedeemed\"]}')
print(f'领取率: {round(k[\"claimRate\"]*100,1)}% | 核销率: {round(k[\"redeemRate\"]*100,1)}%')
print(f'探店笔记: {k[\"reviewCount\"]}篇 均赞: {round(k[\"avgLikes\"],1)}')
print('优惠券明细:')
for c in d['couponAnalytics'][:3]:
    print(f\"  {c['title']: 领取{c['claimedCount']}/{c['totalCount']} 领取率={round(c['claimRate']*100,1)}% 核销率={round(c['redeemRate']*100,1)}%')
"
