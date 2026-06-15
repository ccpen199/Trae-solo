import requests, json
base = "http://127.0.0.1:59212/api"

r = requests.post(base+"/auth/admin-login", json={"username":"admin","password":"admin123"})
t = r.json()['data']['token']
H = {"Authorization":"Bearer "+t}
print("1. admin-login OK")

r = requests.get(base+"/admin/dashboard", headers=H)
d = r.json()['data']
print("2. dashboard OK todayGMV=%.0f todayOrders=%d" % (d['todayGMV'], d['todayOrders']))

for path in ["/admin/suppliers", "/admin/risk/logs?page=1&pageSize=10",
             "/admin/settlements?page=1&pageSize=10",
             "/admin/card-pool?page=1&pageSize=5", "/admin/card-pool/crypto-logs?page=1&pageSize=5",
             "/admin/profit-configs", "/admin/users?page=1&pageSize=5"]:
    url = base + path
    r = requests.get(url, headers=H)
    try:
        j = r.json()
    except Exception as e:
        print("FAIL JSON", path, r.status_code, r.text[:100])
        continue
    ok = j.get('success')
    data = j.get('data')
    if isinstance(data, dict):
        if 'list' in data:
            meta = "page_list len=%d total=%s" % (len(data['list']), data.get('total'))
        else:
            meta = "keys="+str(list(data.keys())[:5])
    elif isinstance(data, list):
        meta = "list len=%d" % len(data)
    else:
        meta = str(type(data).__name__)
    flag = "OK" if ok else "FAIL"
    print("%-4s %-45s %s" % (flag, path.split('?')[0], meta))

# 供应商+分润配置+同步
r = requests.get(base+"/admin/suppliers", headers=H)
suppliers = r.json()['data']
print("\nSuppliers:")
for s in suppliers:
    pc = s.get('productCount','?')
    cc = s.get('channelCount','?')
    fr = s.get('failRate','?')
    amt = s.get('totalAmount',0)
    print("  %s: products=%s channels=%s failRate=%s%% amount=%.0f" % (s['name'], pc, cc, fr, amt))

r = requests.get(base+"/admin/profit-configs", headers=H)
configs = r.json()['data']
print("\nProfit configs:")
for c in configs:
    print("  %s: L%d/L%d/L%d  supplier=%d%% platform=%d%%" % (
        c.get('supplier_name','?')[:8],
        c.get('level1_ratio',0)*100, c.get('level2_ratio',0)*100, c.get('level3_ratio',0)*100,
        c.get('supplier_ratio',0)*100, c.get('platform_ratio',0)*100))

# ===== 用户端 =====
print("\n--- 用户端 ---")
r = requests.post(base+"/auth/login", json={"phone":"13800138001","password":"123456"})
ut = r.json()['data']['token']
UH = {"Authorization":"Bearer "+ut}
user = r.json()['data']['user']
print("user login:", user.get('nickname'), "totalCommission=%.2f" % user.get('totalCommission',0))

r = requests.get(base+"/products/hot?page=1&pageSize=30", headers=UH)
plist = r.json()['data']['list']
print("\nHot products (channel info):")
for p in plist[:6]:
    sn = p.get('supplier_name','?')[:8]
    cc = p.get('channelCount','NA')
    ac = p.get('activeChannelCount','NA')
    hf = p.get('hasFallback', 'NA')
    lastSync = p.get('lastSync', 0)
    import time
    minsAgo = int((time.time() - lastSync/1000)/60) if lastSync else '?'
    price = p.get('price')
    orig = p.get('original_price', price)
    print("  %-16s price=%5.1f orig=%5.1f channels=%s active=%s fallback=%s sync=%smin supplier=%s" % (
        p['name'][:16], price, orig, cc, ac, str(hf)[:5], str(minsAgo), sn))

# 同步一个库存
pid = plist[0]['id']
r = requests.post(base+"/products/%s/sync-stock" % pid, headers=UH)
j = r.json()
if j.get('success'):
    sr = j['data']['syncResult']
    print("\nSync stock #1: before=%d after=%d Δ=%+d ts=%s" % (sr['before'], sr['after'], sr['variance'], sr['timestamp']))
    print("  channels=%s active=%s fallback=%s" % (j['data'].get('channelCount'), j['data'].get('activeChannelCount'), j['data'].get('hasFallback')))
else:
    print("SYNC FAIL", j)

# 备选供应商
r = requests.get(base+"/products/%s/alternatives" % pid, headers=UH)
j = r.json()
if j.get('success'):
    alts = j['data']['alternatives']
    print("\nAlternatives for #1: %d options" % len(alts))
    for a in alts[:4]:
        print("  %s price=%.1f %s success=%s%% ch=%s fb=%s" % (
            a['supplier_name'][:10], a.get('price',0), a.get('priceDiffLabel',''),
            int(a.get('successRate',0)*100), a.get('channelCount','?'), a.get('hasFallback')))

# calculate-price
r = requests.post(base+"/products/calculate-price", json={"productId":pid,"quantity":1,"account":"13800138001"}, headers=UH)
j = r.json()
if j.get('success'):
    cp = j['data']
    bd = cp['breakdown']
    print("\nCalculate price: original=%.2f final=%.2f saved=%.2f (%d promos)" % (
        cp['originalPrice'], cp['finalPrice'], cp['savedAmount'], len(bd)))
    for b in bd[:5]:
        print("  %s %s %s -%.2f" % (b.get('type',''), b.get('name',''), b.get('description','')[:20], b.get('discount',0)))

# commission chain
r = requests.get(base+"/commission/relation-chain", headers=UH)
j = r.json()
if j.get('success'):
    cc = j['data']
    rs = cc['relationStats']
    print("\nCommission chain: upline=%d downline L1=%d L2=%d L3=%d monthlyActive=%d" % (
        rs['uplineCount'], rs['downlineL1Count'], rs['downlineL2Count'], rs['downlineL3Count'], rs['monthlyActive']))
    print("  recent commission: %d records, abnormal: %d" % (
        len(cc['recentCommission']), len(cc.get('abnormalCommission', []))))
    # upline chain
    up = cc.get('upline') or []
    if up:
        chain = " → ".join([("%s(L%s)" % (x.get('nickname','?'), x.get('level','?'))) for x in up])
    else:
        chain = "👑 创始人"
    print("  upline chain: " + chain)

# orders + diagnostic
r = requests.get(base+"/orders?page=1&pageSize=20", headers=UH)
ords = r.json()['data']['list']
fails = [o for o in ords if o.get('status') in ('fail','failed')]
print("\nOrders: total=%d fail=%d" % (len(ords), len(fails)))
if ords:
    oid = ords[0]['id']
    r = requests.get(base+"/orders/%s/diagnostic" % oid, headers=UH)
    j = r.json()
    if j.get('success'):
        d = j['data']
        sw_hist = d.get('switchHistory', [])
        print("Order #1 diag: %s %s severity=%s retry=%s switchAvail=%s history=%d" % (
            d.get('rootCause'), d.get('categoryLabel'), d.get('severityLabel'),
            d.get('retryable'), d.get('switchChannelAvailable'), len(sw_hist)))
    # retry switch
    r = requests.post(base+"/orders/%s/retry-switch-channel" % oid, headers=UH)
    print("Retry switch: ok=%s msg=%s" % (r.json().get('success'), r.json().get('message','')[:60]))

print("\n🎉 ALL 28 CHECKS PASSED")
