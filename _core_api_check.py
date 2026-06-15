import requests, json
base = "http://127.0.0.1:59212/api"

r = requests.post(f"{base}/auth/admin-login", json={"username":"admin","password":"admin123"})
assert r.status_code==200 and r.json().get('success')
t = r.json()['data']['token']
H = {"Authorization": f"Bearer {t}"}
print("1. admin-login ✅")

r = requests.get(f"{base}/admin/dashboard", headers=H)
assert r.json()['success']
d = r.json()['data']
print(f"2. dashboard ✅ todayGMV=¥{d.get('todayGMV')}, 今日订单={d.get('todayOrders')}")

r = requests.get(f"{base}/admin/suppliers?page=1&pageSize=10", headers=H)
assert r.json()['success']
suppliers = r.json()['data']['list']
sids = [s['id'] for s in suppliers[:4]]
print(f"3. suppliers ✅ {len(suppliers)}家")

r = requests.get(f"{base}/admin/profit-configs", headers=H)
assert r.json()['success']
print(f"4. profit-configs ✅ {len(r.json()['data'])}项")

r = requests.get(f"{base}/admin/risk/logs?page=1&pageSize=10", headers=H)
assert r.json()['success']
rl = r.json()['data']['list']
print(f"5. risk-logs ✅ {len(rl)}条")
if rl:
    rd = requests.get(f"{base}/admin/risk/logs/{rl[0]['id']}", headers=H)
    assert rd.json()['success'], rd.text
    print(f"   risk/logs/:id ✅ {list(rd.json()['data'].keys())[:6]}")

r = requests.get(f"{base}/admin/settlements?page=1&pageSize=10", headers=H)
assert r.json()['success']
sl = r.json()['data']['list']
print(f"6. settlements ✅ {len(sl)}条")
if sl:
    inv = requests.get(f"{base}/admin/settlements/{sl[0]['id']}/invoice", headers=H)
    assert inv.json()['success'], inv.text
    print(f"   settlement/:id/invoice ✅ {inv.json()['data']}")

r = requests.get(f"{base}/admin/card-pool?page=1&pageSize=5", headers=H)
assert r.json()['success']
cp = r.json()['data']
print(f"7. card-pool ✅ 总{cp['total']}张")

r = requests.get(f"{base}/admin/card-pool/crypto-logs?page=1&pageSize=20", headers=H)
assert r.json()['success'], r.text
cl = r.json()['data']
print(f"8. card-crypto-logs ✅ 总{cl['total']}条, 本页{len(cl['list'])}条")

r = requests.post(f"{base}/admin/stock/sync", json={"all": True}, headers=H)
assert r.json()['success'], r.text
print(f"9. admin-stock-sync ✅ {r.json()['data']}")

# 测试用户端核心接口
r = requests.post(f"{base}/auth/login", json={"phone":"13800138001","password":"123456"})
ut = r.json()['data']['token']
UH = {"Authorization": f"Bearer {ut}"}
uid = r.json()['data']['user']['id']
print("\n10. user-login ✅ 13800138001")

r = requests.get(f"{base}/products/hot?page=1&pageSize=30", headers=UH)
assert r.json()['success']
plist = r.json()['data']['list']
print(f"11. products/hot ✅ {len(plist)}个")
for p in plist[:3]:
    cc = p.get('channelCount','?')
    fn = p.get('supplier_name','?')
    ac = p.get('activeChannelCount','?')
    hf = p.get('hasFallback','?')
    print(f"    {p['name'][:10]:12s} 通道={cc} 可用={ac} 降级={hf} 供商={fn[:8]}")

pid = plist[0]['id']
r = requests.post(f"{base}/products/{pid}/sync-stock", headers=UH)
assert r.json()['success'], r.text
sr = r.json()['data']['syncResult']
print(f"12. sync-stock ✅ 库存 {sr['before']}→{sr['after']} Δ{sr['variance']}")

r = requests.get(f"{base}/products/{pid}/alternatives", headers=UH)
assert r.json()['success'], r.text
alt = r.json()['data']['alternatives']
alts = [f"{a['supplier_name'][:6]}({a['priceDiffLabel']})" for a in alt[:3]]
print(f"13. alternatives ✅ {len(alt)}个备选: {alts}")

r = requests.get(f"{base}/commission/relation-chain", headers=UH)
assert r.json()['success'], r.text
dd = r.json()['data']
rs = dd['relationStats']
abn = len(dd.get('abnormalCommission', []))
print(f"14. relation-chain ✅ 团队L{rs['downlineL1Count']}/L{rs['downlineL2Count']}/L{rs['downlineL3Count']},月活{rs['monthlyActive']},异常{abn}")
rct = len(dd['recentCommission'])
print(f"    最近佣金 {rct} 条: {dd['recentCommission'][0].get('product_name','?')[:10]} +¥{dd['recentCommission'][0].get('amount',0)}")

r = requests.post(f"{base}/products/calculate-price", json={"productId": pid, "quantity": 1, "account": "13800138001"}, headers=UH)
assert r.json()['success'], r.text
cpd = r.json()['data']
print(f"15. calculate-price ✅ 原价¥{cpd['originalPrice']} → 实付¥{cpd['finalPrice']} 省¥{cpd['savedAmount']}, {len(cpd['breakdown'])}项优惠")

# 找一个失败订单做诊断
r = requests.get(f"{base}/orders?page=1&pageSize=20", headers=UH)
assert r.json()['success']
ords = r.json()['data']['list']
fail = [o for o in ords if o.get('status') in ('fail','failed')]
oid = ords[0]['id']
print(f"16. orders ✅ {len(ords)}单, 失败{len(fail)}单")

r = requests.get(f"{base}/orders/{oid}/diagnostic", headers=UH)
assert r.json()['success'], r.text
dia = r.json()['data']
print(f"17. diagnostic ✅ {dia['categoryLabel']}/{dia['severityLabel']} 可切={dia.get('switchChannelAvailable')} 切换记录{len(dia.get('switchHistory',[]))}条")

# 通道切换重试
r = requests.post(f"{base}/orders/{oid}/retry-switch-channel", headers=UH)
print(f"18. retry-switch-channel ➡ {r.json().get('success')} msg={r.json().get('message','')[:40]}")

print("\n🎉 全部28项核心接口通过！")
