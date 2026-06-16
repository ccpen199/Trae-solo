#!/usr/bin/env python3
import requests, json
B = 'http://127.0.0.1:59212/api'

r = requests.post(B + '/auth/login', json={'phone': '13800138001', 'password': '123456'})
ut = r.json()['data']['token']
UH = {'Authorization': 'Bearer ' + ut}

for path in ['/products/hot?page=1&pageSize=5', '/products?page=1&pageSize=5']:
    r = requests.get(B + path, headers=UH)
    data = r.json()
    ok = data.get('success')
    d = data.get('data')
    t = type(d).__name__
    if isinstance(d, dict):
        keys = list(d.keys())
        sample = list(d.items())[:2]
    elif isinstance(d, list):
        keys = 'list len=%d' % len(d)
        sample = d[:1]
    else:
        keys = ''
        sample = []
    print(path)
    print("  ok=%s type=%s keys=%s" % (ok, t, keys))
    if sample:
        if isinstance(sample[0], tuple):
            for k,v in sample:
                if isinstance(v, (list, dict)):
                    print("  %s=%s %s" % (k, type(v).__name__, str(v)[:80]))
                else:
                    print("  %s=%s" % (k, v))
        else:
            p = sample[0]
            if isinstance(p, dict):
                print("  首item keys:", list(p.keys())[:20])
    print()
