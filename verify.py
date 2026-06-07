#!/usr/bin/env python3
import requests

BASE = "http://127.0.0.1:58933"

# 登录
r = requests.post(f"{BASE}/api/auth/login", json={"username":"shipper01","password":"shipper123"})
token = r.json()["data"]["token"]

# 获取运单列表
r = requests.get(f"{BASE}/api/waybill", headers={"Authorization": f"Bearer {token}"})
print("运单列表响应:")
print(r.json())
print("\n最新运单ID:")
wb = r.json()["data"]["list"][0]
print(f"ID: {wb['id']}, 运单号: {wb['waybill_no']}, 状态: {wb['status']}")
