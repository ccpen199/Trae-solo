#!/usr/bin/env python3
import requests, sys

BASE = 'http://127.0.0.1:59220'

# 1. 健康检查
try:
    r = requests.get(f'{BASE}/api/health', timeout=10)
    print('健康检查:', r.status_code, r.json())
except Exception as e:
    print('健康检查失败:', e)
    sys.exit(1)

# 2. Feed检查
r = requests.get(f'{BASE}/api/posts/feed', params={'latitude':39.9939,'longitude':116.4778,'limit':20})
d = r.json()
posts = d.get('posts', [])
srcs = set(p.get('sourceLevel') for p in posts)
risks = set()
for p in posts:
    for l in p.get('auditLogs', []) or []:
        if l.get('riskLevel'): risks.add(l.get('riskLevel'))
has_pitfall = any(p.get('isPitfall') for p in posts)
print(f'Feed: {len(posts)}篇, 信源: {srcs}, 避坑: {has_pitfall}, 风险: {risks}')
expected = {'GOV','OFFICIAL','V','ORDINARY'}
print(f'信源全覆盖: {expected.issubset(srcs)}')

# 3. 前端代理
try:
    r2 = requests.get('http://127.0.0.1:49220/api/health', timeout=10)
    print('Vite代理健康:', r2.status_code)
except Exception as e:
    print('Vite代理检查失败:', e)
