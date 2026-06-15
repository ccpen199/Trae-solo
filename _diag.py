import requests, json, time
b='http://127.0.0.1:59212/api'
print("=== 服务健康检查 ===")
for name, port, path in [('用户端',49212,'/'),('管理端',49213,'/'),('后端',59212,'/api/health')]:
    try:
        r=requests.get(f'http://127.0.0.1:{port}{path}', timeout=3)
        print(f'  {name}:{port} -> {r.status_code} OK')
    except Exception as e:
        print(f'  {name}:{port} -> FAIL {e}')

print("\n=== 登录 ===")
r=requests.post(b+'/auth/login', json={'phone':'13800138001','password':'123456'})
ut=r.json()['data']['token']
UH={'Authorization':'Bearer '+ut}
print('  用户登录 OK:', r.json()['data']['user']['nickname'])

r=requests.post(b+'/auth/admin-login', json={'username':'admin','password':'admin123'})
at=r.json()['data']['token']
AH={'Authorization':'Bearer '+at}
print('  管理员登录 OK')

print("\n=== 1. SKU分布 ===")
for key, path in [('hot','/products/hot?page=1&pageSize=100'),
                  ('all','/products?page=1&pageSize=300')]:
    r=requests.get(b+path, headers=UH)
    d=r.json()['data']
    lst=d['list'] if isinstance(d,dict) else d
    total=d.get('total', len(lst)) if isinstance(d,dict) else len(lst)
    cats={}
    for p in lst:
        c=p.get('category_name') or p.get('category_id') or '未知'
        cats[c]=cats.get(c,0)+1
    channels = sum(p.get('channelCount',0) or 0 for p in lst)
    hasFallback = sum(1 for p in lst if p.get('hasFallback'))
    print(f'  {key}: total={total}, 本页={len(lst)}, 分类={cats}')
    print(f'         总通道数={channels}, 有降级={hasFallback}')
    if lst:
        p=lst[0]
        print(f'         首商品字段: {[k for k in p.keys() if k in ("name","price","stock","channelCount","activeChannelCount","hasFallback","lastSync","supplier_name","category_name","region_limited","sync_batch")]}')

print("\n=== 2. 商品详情字段（含可售范围/同步批次）===")
r=requests.get(b+'/products?page=1&pageSize=1', headers=UH)
lst=r.json()['data']['list']
pid=lst[0]['id'] if lst else None
if pid:
    r=requests.get(b+f'/products/{pid}', headers=UH)
    p=r.json()['data']
    print(f'  详情字段数={len(p.keys())}')
    important=[k for k in ['id','name','stock','channelCount','channels','hasFallback','lastSync','supplier_name','supplier_id','category_name','category_id','original_price','price','region_limited','status','sync_batch','available_regions'] if k in p]
    missing=[k for k in ['channels','available_regions','sync_batch','region_limited'] if k not in p]
    print(f'  关键字段: {important}')
    print(f'  缺失字段: {missing}')
    for k in important:
        v=p[k]
        if isinstance(v,(list,dict)):
            print(f'    {k} = {str(v)[:150]}')
        else:
            print(f'    {k} = {v}')

print("\n=== 3. 备选供应商 ===")
if pid:
    r=requests.get(b+f'/products/{pid}/alternatives', headers=UH)
    j=r.json()
    print(f'  success={j["success"]}')
    if j['success']:
        data=j['data']
        print(f'  hasMultiSupplier={data.get("hasMultiSupplier")}, current={data.get("currentSupplier",{})[:3]}')
        for a in (data.get('alternatives') or [])[:3]:
            print(f'    备选: {a.get("supplier_name")[:8]} price={a.get("price")} diff={a.get("priceDiffLabel")} success={a.get("successRate")} ch={a.get("channelCount")} fb={a.get("hasFallback")}')

print("\n=== 4. 价格计算（优惠拆分）===")
if pid:
    r=requests.post(b+'/products/calculate-price', json={'productId':pid,'quantity':1,'account':'13800138001'}, headers=UH)
    j=r.json()
    print(f'  success={j["success"]}')
    if j['success']:
        d=j['data']
        print(f'  原价={d.get("originalPrice")} 实付={d.get("finalPrice")} 省={d.get("savedAmount")}')
        for bd in (d.get('breakdown') or [])[:5]:
            print(f'    {bd.get("type")} {bd.get("name")} -{bd.get("discount")} {bd.get("description","")[:30]}')

print("\n=== 5. 佣金关系链 ===")
r=requests.get(b+'/commission/relation-chain', headers=UH)
j=r.json()
print(f'  success={j["success"]}')
if j['success']:
    d=j['data']
    rs=d['relationStats']
    print(f'  统计: upline={rs["uplineCount"]} L1={rs["downlineL1Count"]} L2={rs["downlineL2Count"]} L3={rs["downlineL3Count"]} 月活={rs.get("monthlyActive")}')
    up=d.get('upline') or []
    if up:
        chain = [u.get('nickname','?')+'(L'+str(u.get('level','?'))+')' for u in up]
        print('  上级链路:', chain)
    else:
        print('  上级链路: 👑创始人')
    for lvl in ['1','2','3']:
        dl=(d.get('downline') or {}).get(lvl,[])
        print(f'  L{lvl} 下级数={len(dl)} 首3={[(x.get("nickname","?")[:6], x.get("totalSpent",0), x.get("contributedCommission",0), x.get("isActive")) for x in dl[:3]]}')
    rc=d.get('recentCommission',[])
    print(f'  最近佣金={len(rc)}条: {[(x.get("product_name","?")[:8], x.get("level"), round(x.get("amount",0),2), x.get("status")) for x in rc[:3]]}')
    abn=d.get('abnormalCommission',[])
    print(f'  异常佣金={len(abn)}条')

print("\n=== 6. 订单+诊断+错误码 ===")
r=requests.get(b+'/orders?page=1&pageSize=10', headers=UH)
ords=r.json()['data']['list']
print(f'  订单数={len(ords)}')
status_cnt={}
for o in ords: status_cnt[o.get('status')]=status_cnt.get(o.get('status'),0)+1
print(f'  状态分布: {status_cnt}')
for o in ords[:2]:
    oid=o['id']
    r2=requests.get(b+f'/orders/{oid}/diagnostic', headers=UH)
    j2=r2.json()
    if j2['success']:
        d=j2['data']
        print(f'    {o.get("status")} {o.get("name","")[:10]}: {d.get("categoryLabel")}/{d.get("severityLabel")} retry={d.get("retryable")} switchAvail={d.get("switchChannelAvailable")} switchHist={len(d.get("switchHistory",[]))} code={d.get("errorCode")}')

print("\n=== 7. 管理后台核心接口 ===")
checks = [
    ('suppliers','/admin/suppliers', 'list'),
    ('profit-configs','/admin/profit-configs', None),
    ('card-pool','/admin/card-pool?page=1&pageSize=3', 'list'),
    ('crypto-logs','/admin/card-pool/crypto-logs?page=1&pageSize=5', 'list'),
    ('settlements','/admin/settlements?page=1&pageSize=5', 'list'),
    ('risk-logs','/admin/risk/logs?page=1&pageSize=5', None),
    ('dashboard','/admin/dashboard', None),
]
for name, path, listkey in checks:
    r=requests.get(b+path, headers=AH)
    try:
        j=r.json()
    except Exception as e:
        print(f'  {name}: FAIL JSON {r.status_code} {r.text[:60]}'); continue
    ok=j.get('success')
    data=j.get('data')
    if isinstance(data, dict):
        if listkey and listkey in data:
            extra = f'list={len(data[listkey])} total={data.get("total","?")}'
        else:
            extra = f'keys={list(data.keys())[:5]}'
    elif isinstance(data, list):
        extra = f'list={len(data)}'
    else:
        extra = str(type(data).__name__)
    print(f'  {name}: ok={ok} {extra}')
