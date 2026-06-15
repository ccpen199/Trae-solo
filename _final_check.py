import requests, json, time
b='http://127.0.0.1:59212/api'
print("="*60)
print("  虚拟商品聚合平台 - 全链路验收测试")
print("="*60)

# 登录
r=requests.post(b+'/auth/login', json={'phone':'13800138001','password':'123456'})
ut=r.json()['data']['token']
UH={'Authorization':'Bearer '+ut}
user=r.json()['data']['user']
print("\n✅ 用户登录:", user.get('nickname'))

r=requests.post(b+'/auth/admin-login', json={'username':'admin','password':'admin123'})
at=r.json()['data']['token']
AH={'Authorization':'Bearer '+at}
print("✅ 管理员登录: admin")

passed=0
total=0
def check(name, cond, detail=""):
    global passed, total
    total+=1
    if cond: passed+=1
    flag="✅" if cond else "❌"
    print(f"  {flag} {name} {('→ '+detail[:60]) if detail else ''}")

# ===== 1. 商品池完整清单 =====
print("\n--- 1. SKU商品池 ---")
r=requests.get(b+'/products?page=1&pageSize=500', headers=UH)
d=r.json()['data']
lst=d['list']
total_sku=d.get('total', len(lst))
check("SKU总数≥200", total_sku >= 200, f"{total_sku}个")

# 分类分布
cats={}
for p in lst:
    c=p.get('category_name','未知')
    cats[c]=cats.get(c,0)+1
cat_list=list(cats.items())
check("分类≥6个", len(cats) >= 6, f"{len(cats)}个: {dict(list(cats.items())[:4])}...")

# 字段完整性
sample=lst[0]
fields_to_check=['name','price','stock','channelCount','activeChannelCount','hasFallback','lastSync','supplier_name','category_name','sync_batch','available_regions','region_limited']
missing=[f for f in fields_to_check if f not in sample]
check("列表字段完整", len(missing)==0, f"缺失:{missing}" if missing else "全部命中")

# ===== 2. 商品详情字段 =====
print("\n--- 2. 商品详情字段 ---")
pid=lst[0]['id']
r=requests.get(b+f'/products/{pid}', headers=UH)
pd=r.json()['data']
detail_fields=['sync_batch','available_regions','region_limited','supplier_info','stock_sync_history','channelStatus','channels','hasFallback']
missing2=[f for f in detail_fields if f not in pd]
check("详情字段完整", len(missing2)==0, f"缺失:{missing2}" if missing2 else "全部命中")
check("有供应商信息", 'supplier_info' in pd and isinstance(pd.get('supplier_info'), dict), str(pd.get('supplier_info',{})))
check("有同步历史(≥2条)", 'stock_sync_history' in pd and len(pd['stock_sync_history'])>=2, str(len(pd.get('stock_sync_history',[]))))
check("可用地区数组", isinstance(pd.get('available_regions'), list) and len(pd['available_regions'])>0, str(pd.get('available_regions')[:3]))

# ===== 3. 价格计算/优惠拆分 =====
print("\n--- 3. 价格计算与优惠拆分 ---")
r=requests.post(b+'/products/calculate-price', json={'productId':pid,'quantity':1,'account':'13800138001'}, headers=UH)
cp=r.json()
check("接口200正常", r.status_code==200 and cp.get('success'), r.text[:100])
if cp.get('success'):
    data=cp['data']
    check("有原价/实付/节省", all(k in data for k in ['originalPrice','finalPrice','savedAmount']),
          f"原价={data.get('originalPrice')} 实付={data.get('finalPrice')}")
    check("有优惠明细数组", 'breakdown' in data and isinstance(data['breakdown'], list),
          f"{len(data.get('breakdown',[]))}项")
    check("有返佣预估", 'commissionEarned' in data, f"¥{data.get('commissionEarned',0)}")

# ===== 4. 备选供应商 =====
print("\n--- 4. 多供应商备选 ---")
r=requests.get(b+f'/products/{pid}/alternatives', headers=UH)
alt= r.json()['data'] if r.json().get('success') else {}
check("备选列表", 'alternatives' in alt and len(alt['alternatives'])>=1,
      f"{len(alt.get('alternatives',[]))}个备选")
if alt.get('alternatives'):
    a=alt['alternatives'][0]
    check("备选有价格差", 'priceDiffLabel' in a, a.get('priceDiffLabel',''))
    check("备选有成功率", 'successRate' in a, f"{a.get('successRate')}%")
    check("备选有通道数", 'channelCount' in a, f"{a.get('channelCount')}个")
    check("备选有降级标识", 'hasFallback' in a, str(a.get('hasFallback')))

# ===== 5. 库存同步 =====
print("\n--- 5. 库存实时同步 ---")
before=pd['stock']
r=requests.post(b+f'/products/{pid}/sync-stock', headers=UH)
sync=r.json()
check("同步接口正常", sync.get('success'), sync.get('message',''))
if sync.get('success'):
    sr=sync['data'].get('syncResult', {})
    check("有before/after/variance", all(k in sr for k in ['before','after','variance']),
          f"{sr.get('before')} → {sr.get('after')} Δ{sr.get('variance')}")
    check("有时间戳", 'timestamp' in sr, str(sr.get('timestamp')))

# ===== 6. 订单诊断 =====
print("\n--- 6. 订单与失败诊断 ---")
r=requests.get(b+'/orders?page=1&pageSize=20', headers=UH)
ords=r.json()['data']['list']
check("订单列表正常", len(ords) > 0, f"{len(ords)}单")

fails=[o for o in ords if o.get('status') in ('fail','failed')]
if fails:
    oid=fails[0]['id']
    r=requests.get(b+f'/orders/{oid}/diagnostic', headers=UH)
    dia=r.json()
    check("诊断接口正常", dia.get('success'), dia.get('message',''))
    if dia.get('success'):
        d2=dia['data']
        check("有错误码", 'errorCode' in d2, d2.get('errorCode',''))
        check("有分类+标签", 'categoryLabel' in d2 and 'severityLabel' in d2,
              f"{d2.get('categoryLabel')}/{d2.get('severityLabel')}")
        check("有解决方案", 'suggestions' in d2 and len(d2['suggestions'])>0,
              f"{len(d2['suggestions'])}条建议")
        check("有切换通道可用", 'switchChannelAvailable' in d2, str(d2.get('switchChannelAvailable')))
        check("有切换历史", 'switchHistory' in d2, f"{len(d2.get('switchHistory',[]))}条")
else:
    print("  ⚠️  无失败订单，跳过诊断测试")
    total+=5

# ===== 7. 佣金关系链 =====
print("\n--- 7. 三级关系链 ---")
r=requests.get(b+'/commission/relation-chain', headers=UH)
ch=r.json()
check("关系链接口正常", ch.get('success'), ch.get('message',''))
if ch.get('success'):
    d3=ch['data']
    rs=d3['relationStats']
    check("有上级链路", 'upline' in d3, f"{rs.get('uplineCount')}个上级")
    check("有下级L1/L2/L3", all(k in d3.get('downline',{}) for k in ['1','2','3']),
          f"L1={rs.get('downlineL1Count')} L2={rs.get('downlineL2Count')} L3={rs.get('downlineL3Count')}")
    check("有月活统计", 'monthlyActive' in rs, f"{rs.get('monthlyActive')}人")
    check("有最近佣金", len(d3.get('recentCommission',[])) > 0,
          f"{len(d3.get('recentCommission',[]))}条")
    check("有异常佣金数组", 'abnormalCommission' in d3,
          f"{len(d3.get('abnormalCommission',[]))}条异常")
    check("有结算政策", 'settlementPolicy' in d3, str(list(d3.get('settlementPolicy',{}).keys())[:3]))
    check("三级比例完整", 'rates' in d3 and all(k in d3['rates'] for k in ['level1','level2','level3']),
          f"L1={d3.get('rates',{}).get('level1')}%")

# ===== 8. 管理后台核心接口 =====
print("\n--- 8. 管理后台验收 ---")
admin_checks = [
    ('dashboard', '/admin/dashboard', ['todayGMV','todayOrders','totalGMV','totalUsers']),
    ('suppliers', '/admin/suppliers', None),  # list
    ('profit-configs', '/admin/profit-configs', None),
    ('card-pool分页', '/admin/card-pool?page=1&pageSize=5', ['list','total','cryptoStats']),
    ('加密日志', '/admin/card-pool/crypto-logs?page=1&pageSize=5', ['list','total']),
    ('结算单', '/admin/settlements?page=1&pageSize=5', ['list','total']),
    ('风控日志', '/admin/risk/logs?page=1&pageSize=5', None),
]
for name, path, keys in admin_checks:
    r=requests.get(b+path, headers=AH)
    try:
        j=r.json()
    except:
        check(f"{name}", False, "JSON解析失败"); continue
    ok=j.get('success')
    if not ok:
        check(f"{name}", False, j.get('message','')); continue
    data=j.get('data')
    if keys:
        has_all=all(k in data for k in keys)
        detail=f"字段: {keys if has_all else [k for k in keys if k not in data]}"
        check(name, has_all, detail)
    elif isinstance(data, list):
        check(name, True, f"list={len(data)}")
    elif isinstance(data, dict):
        check(name, True, f"keys={list(data.keys())[:4]}")
    else:
        check(name, True, type(data).__name__)

# 检查卡密加密状态
r=requests.get(b+'/admin/card-pool?page=1&pageSize=3', headers=AH)
cp=r.json()['data']
if cp.get('list'):
    c=cp['list'][0]
    check("卡密已加密", c.get('encrypted')==1 or c.get('is_encrypted')==1,
          f"encrypted={c.get('encrypted')}")
    check("有加密方式", bool(c.get('encryption_method')), c.get('encryption_method',''))
    check("有加密时间", bool(c.get('encryption_time') or c.get('encryption_time')), str(c.get('encryption_time')))

# cryptoStats
cs=cp.get('cryptoStats',{})
check("加密统计存在", 'method' in cs, f"method={cs.get('method','')}")

# ===== 9. 管理后台详情接口 =====
print("\n--- 9. 后台详情页接口 ---")

# 风控日志详情
r=requests.get(b+'/admin/risk/logs?page=1&pageSize=5', headers=AH)
risk_logs=r.json()['data'] if r.json().get('success') else []
if isinstance(risk_logs, dict): risk_logs=risk_logs.get('list',[])
if risk_logs:
    rid=risk_logs[0].get('id')
    r=requests.get(b+f'/admin/risk/logs/{rid}', headers=AH)
    check("风控日志详情", r.json().get('success'), r.json().get('message','')[:50])
else:
    print("  ⚠️  暂无风控日志，跳过")
    total+=1

# 分润配置
r=requests.get(b+'/admin/profit-configs', headers=AH)
pconf=r.json()['data']
if isinstance(pconf, dict): pconf=pconf.get('configs',[])
check("分润配置数量≥3", len(pconf) >= 3, f"{len(pconf)}个")
if pconf:
    pc=pconf[0]
    check("分润有三级比例", all(k in pc for k in ['level1_ratio','level2_ratio','level3_ratio']),
          f"L1={pc.get('level1_ratio')}")
    check("分润有供/平台比例", 'supplier_ratio' in pc and 'platform_ratio' in pc,
          f"供应商={pc.get('supplier_ratio')} 平台={pc.get('platform_ratio')}")

# 结算单+发票
r=requests.get(b+'/admin/settlements?page=1&pageSize=3', headers=AH)
sl=r.json()['data']['list'] if r.json().get('success') else []
if sl:
    sid=sl[0]['id']
    r=requests.get(b+f'/admin/settlements/{sid}/invoice', headers=AH)
    check("结算单发票详情", r.json().get('success'), r.json().get('message','')[:40])
else:
    print("  ⚠️  暂无结算单，跳过")
    total+=1

# ===== 10. 通道切换重试 =====
print("\n--- 10. 通道切换重试 ---")
if fails:
    oid=fails[0]['id']
    r=requests.post(b+f'/orders/{oid}/retry-switch-channel', headers=UH)
    check("切换通道重试接口", r.status_code==200, f"status={r.status_code} body={r.text[:60]}")
else:
    print("  ⚠️  无失败订单，跳过")
    total+=1

# ===== 汇总 =====
print("\n"+"="*60)
rate=passed/total*100 if total else 0
print(f"  验收结果: ✅ {passed}/{total} 通过 ({rate:.1f}%)")
print("="*60)
