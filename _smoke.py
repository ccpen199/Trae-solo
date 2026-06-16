#!/usr/bin/env python3
import requests, json

B = 'http://127.0.0.1:59212/api'
try:
    r = requests.get(B + '/health', timeout=3)
    print('后端健康检查:', r.status_code, r.text[:60])
except Exception as e:
    print('后端健康检查失败:', e)
    print('尝试启动后端服务...')
    exit(1)

# 登录
r = requests.post(B + '/auth/login', json={'phone': '13800138001', 'password': '123456'})
ut = r.json()['data']['token']
UH = {'Authorization': 'Bearer ' + ut}

# 首页数据
r = requests.get(B + '/products/hot?page=1&pageSize=30', headers=UH)
hot = r.json()['data']
print(f"\n热门商品: total={hot.get('total')} list={len(hot.get('list',[]))}")

# 分类
r = requests.get(B + '/products?page=1&pageSize=50', headers=UH)
allp = r.json()['data']
print(f"全部商品: total={allp.get('total')} list={len(allp.get('list',[]))}")

# 详情
p = allp['list'][0]
print(f"\n示例商品: {p.get('name')[:20]}")
print(f"  supplier={p.get('supplier_name','?')[:8]}")
for k in ['price','stock','channelCount','activeChannelCount','hasFallback','sync_batch','region_limited','available_regions','lastSync']:
    v = p.get(k)
    if k == 'available_regions':
        tv = type(v).__name__
        sv = str(v)[:40]
        print(f"  {k}:={tv}={sv}")
    else:
        print(f"  {k}:={v}")

# 价格计算
r = requests.post(B + '/products/calculate-price', headers=UH, json={
    'productId': p['id'], 'quantity': 1, 'account': '13800138001'})
print(f"\n价格计算: success={r.json().get('success')}")
if r.json().get('success'):
    d = r.json()['data']
    print(f"  原价={d.get('originalPrice')} 实付={d.get('finalPrice')} 节省={d.get('savedAmount')} 返佣={d.get('commissionEarned')} 优惠项={len(d.get('breakdown',[]))}")

# 备选供应商
r = requests.get(B + f'/products/{p["id"]}/alternatives', headers=UH)
alt = r.json()['data']
print(f"\n备选供应商: 总备选={alt.get('totalAlternatives')} hasMulti={alt.get('hasMultiSupplier')}")
for a in (alt.get('alternatives') or [])[:3]:
    sn = (a.get('supplier_name') or '?')[:10]
    sr = a.get('successRate', 0)
    print(f"  {sn} price={a.get('price')} diff={a.get('priceDiffLabel')} success={sr:.2f} ch={a.get('channelCount')}")

# 关系链
r = requests.get(B + '/commission/relation-chain', headers=UH)
cc = r.json()['data']
rs = cc['relationStats']
print(f"\n关系链: upline={rs.get('uplineCount')} L1={rs.get('downlineL1Count')} L2={rs.get('downlineL2Count')} L3={rs.get('downlineL3Count')} 月活={rs.get('monthlyActive')}")
print(f"  最近佣金={len(cc.get('recentCommission',[]))}条,异常={len(cc.get('abnormalCommission',[]))}条")

# 订单
r = requests.get(B + '/orders?page=1&pageSize=5', headers=UH)
ords = r.json()['data']['list']
statuses = {}
for o in ords: statuses[o['status']] = statuses.get(o['status'],0)+1
print(f"\n订单: 共{len(ords)}单 状态={statuses}")
fails = [o for o in ords if o.get('status') in ('fail','failed')]
if fails:
    d = fails[0]
    r = requests.get(B + "/orders/" + d['id'] + "/diagnostic", headers=UH)
    dd = r.json().get('data',{})
    print(f"  失败订单诊断: code={dd.get('errorCode')} sev={dd.get('severityLabel')} switchAvail={dd.get('switchChannelAvailable')} switches={len(dd.get('switchHistory',[]))}")

# 管理后台
r = requests.post(B + '/auth/admin-login', json={'username':'admin','password':'admin123'})
at = r.json()['data']['token']
AH = {'Authorization': 'Bearer ' + at}

checks = [
    ('供应商', '/admin/suppliers', None),
    ('分润配置', '/admin/profit-configs', None),
    ('卡密池', '/admin/card-pool?page=1&pageSize=3', ['list','total','cryptoStats']),
    ('加密日志', '/admin/card-pool/crypto-logs?page=1&pageSize=3', ['list','total']),
    ('结算单', '/admin/settlements?page=1&pageSize=3', ['list','total']),
    ('风控日志', '/admin/risk/logs?page=1&pageSize=3', None),
]
print('\n管理后台:')
for name,path,keys in checks:
    r = requests.get(B + path, headers=AH)
    j = r.json()
    ok = j.get('success')
    d = j.get('data')
    detail = ''
    if isinstance(d, dict):
        if 'list' in d and isinstance(d['list'], list):
            detail = "list=%d total=%s" % (len(d['list']), d.get('total','?'))
        elif keys:
            detail = "keys=%s" % list(d.keys())[:4]
        else:
            detail = "keys=%s" % list(d.keys())[:5]
    elif isinstance(d, list):
        detail = "len=%d" % len(d)
    s = "  ✅ %s: %s" if ok else "  ❌ %s: %s"
    print(s % (name, detail if ok else j.get('message')))

print("\n🎉 冒烟测试通过!")
