#!/usr/bin/env python3
import requests
import json

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3ODE1NzgwNTEsImV4cCI6MTc4MjE4Mjg1MX0.etO6ujbCDYEcK9DKwoAtq41nqe88t_V6cKVGSBB4MNQ"
headers = {"Authorization": f"Bearer {TOKEN}"}

# Test card-pool
r = requests.get("http://127.0.0.1:59212/api/admin/card-pool?page=1&pageSize=3", headers=headers)
print("=== /admin/card-pool ===")
print("Status:", r.status_code)
data = r.json()
print(json.dumps(data, indent=2, ensure_ascii=False))

# Test card-pool/stats
r2 = requests.get("http://127.0.0.1:59212/api/admin/card-pool/stats", headers=headers)
print("\n=== /admin/card-pool/stats ===")
print("Status:", r2.status_code)
data2 = r2.json()
print(json.dumps(data2, indent=2, ensure_ascii=False))

# Test risk/logs
r3 = requests.get("http://127.0.0.1:59212/api/admin/risk/logs?limit=20", headers=headers)
print("\n=== /admin/risk/logs ===")
print("Status:", r3.status_code)
data3 = r3.json()
print("count:", len(data3.get('data', [])))
print(json.dumps(data3.get('data', [])[:2], indent=2, ensure_ascii=False))
