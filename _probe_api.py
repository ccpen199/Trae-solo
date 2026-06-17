#!/usr/bin/env python3
import requests, json
B = 'http://127.0.0.1:59212/api'

# 管理员登录
r = requests.post(B + '/auth/admin-login', json={'username':'admin','password':'admin123'})
at = r.json()['data']['token']
AH = {'Authorization': 'Bearer ' + at}

# 用户登录
r = requests.post(B + '/auth/login', json={'phone':'13800138001','password':'123456'})
ut = r.json()['data']['token']
UH = {'Authorization': 'Bearer ' + ut}

def probe(name, path, headers):
    try:
        r = requests.get(B + path, headers=headers, timeout=10)
        j = r.json()
        ok = j.get('success', False)
        d = j.get('data')
        detail = ''
        if isinstance(d, dict):
            keys = list(d.keys())[:10]
            detail = f"keys={keys}"
            # 打印数字类型字段值
            nums = {k:v for k,v in d.items() if isinstance(v,(int,float)) and k not in ('page','pageSize','limit')}
            if nums:
                detail += f" nums={nums}"
        elif isinstance(d, list):
            detail = f"list len={len(d)}"
        print(f"{'✅' if ok else '❌'} {name:20s}: {detail}")
        if not ok:
            print(f"   msg: {j.get('message')}")
        return ok, d
    except Exception as e:
        print(f"❌ {name:20s}: 异常 {e}")
        return False, None

print("="*60)
print("🔍 管理后台API探测")
print("="*60)
probe('Dashboard', '/admin/dashboard', AH)
probe('订单列表', '/admin/orders?page=1&pageSize=5', AH)
probe('商品列表', '/admin/products?page=1&pageSize=5', AH)
probe('卡密池Stats', '/admin/card-pool/stats', AH)
probe('卡密池列表', '/admin/card-pool?page=1&pageSize=3', AH)
probe('供应商', '/admin/suppliers', AH)
probe('风控日志', '/admin/risk/logs?limit=5', AH)
probe('错误码', '/orders/error-codes', AH)

print("\n" + "="*60)
print("🔍 用户端API探测")
print("="*60)
probe('热门商品', '/products/hot?page=1&pageSize=5', UH)
probe('商品列表', '/products?page=1&pageSize=5', UH)
probe('佣金流水', '/commission/records?page=1&pageSize=5', UH)
probe('关系链', '/commission/relation-chain', UH)

# 取一个商品ID测详情和备选
r = requests.get(B + '/products?page=1&pageSize=1', headers=UH)
try:
    pid = r.json()['data']['list'][0]['id']
    print(f"\n🔍 商品详情测试 (ID={pid})")
    probe('商品详情', f'/products/{pid}', UH)
    probe('备选供应商', f'/products/{pid}/alternatives', UH)
    probe('同步库存', f'/products/{pid}/sync-stock', UH)  # POST但用GET测会报错，忽略
except:
    pass

# 取一个订单ID测详情和诊断
r = requests.get(B + '/admin/orders?page=1&pageSize=1', headers=AH)
try:
    oid = r.json()['data']['list'][0]['id']
    print(f"\n🔍 订单详情测试 (ID={oid})")
    probe('订单详情', f'/orders/admin/{oid}', AH)
    probe('订单诊断', f'/orders/{oid}/diagnostic', AH)
except:
    pass

print("\n✅ 探测完成")
