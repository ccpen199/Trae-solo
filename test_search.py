#!/usr/bin/env python3
import urllib.request, urllib.parse, json

BASE = "http://127.0.0.1:59218/api"

# 登录
req = urllib.request.Request(BASE + '/auth/login',
    data=json.dumps({'username':'employer1','password':'123456'}).encode(),
    headers={'Content-Type':'application/json'}, method='POST')
with urllib.request.urlopen(req) as r:
    d = json.loads(r.read())
token = d['token']
print(f'Token: {token[:30]}...')

def test_search(name, path, keyword):
    kw = urllib.parse.quote(keyword)
    url = f'{BASE}/{path}?keyword={kw}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read())
            total = d.get('total', 0)
            orders = d.get('orders', [])
            print(f'✅ {name}: total={total}, found={len(orders)}')
            for o in orders[:2]:
                print(f'   - {o.get("title","")[:30]}')
            return total > 0
    except Exception as e:
        print(f'❌ {name}: {e}')
        return False

print()
test_search('用工-装修', 'labor-orders', '装修')
test_search('找车-家具', 'delivery-orders', '家具')
test_search('搬家-朝阳区', 'moving-orders', '朝阳区')
