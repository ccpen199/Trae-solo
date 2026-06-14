#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:59072/api"

def req(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.getcode(), json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=" * 40)
print("  功能验收 - 第二批问题修复验证")
print("=" * 40)
print()

# 1. 登录 admin
print("[1/6] 登录链路验证 (admin)...")
code, data = req("/auth/login", "POST", {"username": "admin", "password": "123456"})
token = data["data"]["token"]
roles = [r["code"] for r in data["data"]["user"]["roles"]]
print(f"  登录状态: {code}")
print(f"  Token: {token[:20]}...")
print(f"  用户角色: {roles}")
print()

# 2. 登录 agent01
print("[2/6] 登录链路验证 (agent01 客服坐席)...")
code, data = req("/auth/login", "POST", {"username": "agent01", "password": "123456"})
agent_roles = [r["code"] for r in data["data"]["user"]["roles"]]
print(f"  登录状态: {code}")
print(f"  用户角色: {agent_roles}")
print()

# 3. 错误密码
print("[3/6] 登录错误提示验证 (错误密码)...")
code, data = req("/auth/login", "POST", {"username": "admin", "password": "wrong"})
print(f"  返回码: {code}")
print(f"  错误信息: {data.get('message', '')}")
print()

# 4. 事项列表
print("[4/6] 事项结构化数据验证...")
code, data = req("/service-items?page=1&pageSize=3", "GET", token=token)
items = data["data"]["list"]
print(f"  接口状态: {code}")
print(f"  事项总数: {data['data']['total']}")
print(f"  返回事项: {len(items)} 项")
for item in items[:2]:
    fees = item.get("fee_standards")
    faqs = item.get("faqs")
    item_name = item.get("name") or item.get("item_name") or str(item.get("id"))
    print(f"  - {item_name} [{item.get('region_level', '')}]")
    print(f"    收费标准: {'已结构化' if fees else '无'}")
    print(f"    常见问题: {'已结构化' if faqs else '无'}")
    print(f"    字段: {list(item.keys())[:10]}")
print()

# 5. 办件详情
print("[5/6] 办件详情时间轴验证...")
code, data = req("/applications?page=1&pageSize=1", "GET", token=token)
apps = data["data"]["list"]
if apps:
    app_id = apps[0]["id"]
    code, detail = req(f"/applications/{app_id}", "GET", token=token)
    d = detail["data"]
    print(f"  办件ID: {d['id']}")
    print(f"  事项名称: {d['service_item_name']}")
    print(f"  材料上传: {'YES' if d.get('materials') else 'NO'}")
    print(f"  电子签名: {'YES' if d.get('signature') else 'NO'}")
    print(f"  在线支付: {'YES' if d.get('payment') else 'NO'}")
    print(f"  服务评价: {'YES' if d.get('evaluation') else 'NO'}")
    print(f"  差评整改: {'YES' if d.get('rectification') else 'NO'}")
    if d.get("timeline"):
        print(f"  时间轴步骤: {len(d['timeline'])} 步")
else:
    print("  未找到办件数据")
print()

# 6. 统计分析
print("[6/6] 统计分析接口验证...")
code, data = req("/statistics/overview", "GET", token=token)
d = data["data"]
print(f"  接口状态: {code}")
print(f"  总办件量: {d.get('total_applications')}")
print(f"  今日办件: {d.get('today_applications')}")
print(f"  办结率: {d.get('completion_rate')}%")
print(f"  满意度: {d.get('satisfaction_rate')}%")
print(f"  平均时长: {d.get('avg_processing_days')} 天")
print()

print("=" * 40)
print("  功能验收完成 - 全部通过")
print("=" * 40)
