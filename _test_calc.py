import urllib.request, json
BASE = 'http://127.0.0.1:59212/api'

with urllib.request.urlopen(BASE + '/products/hot') as r:
    pid = json.loads(r.read())['data'][0]['id']
    print('PID:', pid)

data = json.dumps({'items':[{'productId':pid,'quantity':3}]}).encode()
req = urllib.request.Request(BASE + '/calculate-price', data=data, headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req) as r:
        res = json.loads(r.read())
        print('无token: OK' if res['success'] else '无token: FAIL')
        print('  originalAmount:', res['data'].get('originalAmount'))
        print('  finalAmount:', res['data'].get('finalAmount'))
        print('  discountDetails count:', len(res['data'].get('discountDetails', [])))
        for d in res['data'].get('discountDetails', []):
            print('   -', d.get('type'), d.get('promotionName'), d.get('discountAmount'), d.get('description'))
        print('  products count:', len(res['data'].get('products', [])))
        if res['data'].get('products'):
            print('    product supplierName:', res['data']['products'][0].get('supplierName'))
except urllib.error.HTTPError as e:
    print('无token: FAIL HTTP', e.code)
    print(e.read().decode()[:300])
