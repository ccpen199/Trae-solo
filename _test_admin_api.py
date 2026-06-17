#!/usr/bin/env python3
import requests, json

B = 'http://127.0.0.1:59212/api'

r = requests.post(B + '/admin-login', json={'username': 'admin', 'password': 'admin123'})
print('Admin login:', r.status_code)
token = r.json()['data']['token']
headers = {'Authorization': 'Bearer ' + token}

print('\n=== 测试 /admin/products ===')
r = requests.get(B + '/admin/products?page=1&pageSize=1', headers=headers)
data = r.json()
print(f'success: {data.get("success")}')
if data.get('success'):
    p = data['data']['list'][0]
    print(f'商品: {p["name"]}')
    print(f'  channelCount: {p.get("channelCount")}')
    print(f'  activeChannelCount: {p.get("activeChannelCount")}')
    print(f'  supplier_count: {p.get("supplier_count")}')
    print(f'  hasFallback: {p.get("hasFallback")}')
    print(f'  available_regions: {p.get("available_regions")}')
    print(f'  sync_batch: {p.get("sync_batch")}')
    suppliers = p.get('suppliers', [])
    print(f'  suppliers ({len(suppliers)}):')
    for s in suppliers:
        print(f'    - {s["name"]} (main={s["is_main"]}, channels={s["channel_count"]}, success={s["success_rate"]})')
