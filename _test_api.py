#!/usr/bin/env python3
import requests, json

B = 'http://127.0.0.1:59212/api'

r = requests.post(B + '/auth/login', json={'phone': '13800138001', 'password': '123456'})
token = r.json()['data']['token']
headers = {'Authorization': 'Bearer ' + token}

print('=== 测试 /admin/products ===')
r = requests.get(B + '/admin/products?page=1&pageSize=1', headers=headers)
data = r.json()
print(f'success: {data.get("success")}')
if data.get('success'):
    p = data['data']['list'][0]
    print(f'商品: {p["name"]}')
    print(f'  channelCount: {p.get("channelCount")}')
    print(f'  activeChannelCount: {p.get("activeChannelCount")}')
    print(f'  channelStatus: {p.get("channelStatus")}')
    print(f'  supplier_count: {p.get("supplier_count")}')
    print(f'  hasFallback: {p.get("hasFallback")}')
    print(f'  region_limited: {p.get("region_limited")}')
    print(f'  available_regions: {p.get("available_regions")}')
    print(f'  sync_batch: {p.get("sync_batch")}')
    print(f'  stock_sync_history: {p.get("stock_sync_history")}')
    print(f'  suppliers count: {len(p.get("suppliers", []))}')
    if p.get('suppliers'):
        for s in p['suppliers']:
            print(f'    - {s["name"]} (main={s["is_main"]}, channels={s["channel_count"]})')
