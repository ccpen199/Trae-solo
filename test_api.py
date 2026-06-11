import requests
import json

BASE_URL = "http://localhost:59088/api"

print("=" * 60)
print("国家级人社政务服务平台 API 全链路测试")
print("=" * 60)

# 1. 登录
print("\n1. 测试用户登录")
print("-" * 40)
login_data = {"phone": "13800138000", "password": "123456"}
resp = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
result = resp.json()
print(f"响应码: {result.get('code')}")
print(f"消息: {result.get('message')}")

token = None
if result.get("code") == 200 and result.get("data"):
    token = result["data"]["token"]
    user = result["data"]["user"]
    print(f"用户: {user.get('name')}")
    print(f"角色: {user.get('role')}")
    print(f"Token: {token[:30]}...")
else:
    print("登录失败")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 2. 测试首页数据
print("\n2. 测试首页聚合数据")
print("-" * 40)
resp = requests.get(f"{BASE_URL}/home", headers=headers, timeout=10)
result = resp.json()
print(f"响应码: {result.get('code')}")
print(f"消息: {result.get('message')}")
if result.get("data"):
    data = result["data"]
    print(f"用户名: {data.get('user', {}).get('name')}")
    print(f"认证等级: L{data.get('user', {}).get('auth_level')}")
    print(f"属地: {data.get('user', {}).get('province')}")
    print(f"核心服务数: {len(data.get('core_services', []))}")
    print(f"热门服务数: {len(data.get('hot_services', []))}")
    print(f"快捷服务数: {len(data.get('quick_services', []))}")
    print(f"待办数: {len(data.get('todos', []))}")
    print(f"统计: {data.get('stats', {})}")
    if data.get("todos"):
        print("待办列表:")
        for todo in data["todos"][:3]:
            print(f"  [{todo.get('type')}] {todo.get('title')} (优先级: {todo.get('priority')})")

# 3. 测试推荐政策
print("\n3. 测试推荐政策")
print("-" * 40)
resp = requests.get(f"{BASE_URL}/home/policies/recommend", headers=headers, timeout=10)
result = resp.json()
print(f"响应码: {result.get('code')}")
if result.get("data"):
    policies = result["data"]["list"]
    print(f"政策数: {len(policies)}")
    for p in policies[:4]:
        hot_tag = "🔥 热门" if p.get("is_hot") else "   "
        top_tag = "⭐ 置顶" if p.get("is_top") else "   "
        print(f"  {hot_tag}{top_tag} {p.get('title')[:35]}")

# 4. 测试服务列表
print("\n4. 测试服务列表（含跨省路由）")
print("-" * 40)
resp = requests.get(f"{BASE_URL}/services", headers=headers, timeout=10)
result = resp.json()
print(f"响应码: {result.get('code')}")
if result.get("data"):
    services = result["data"]["list"]
    print(f"服务数: {len(services)}")
    print(f"分类: {result['data'].get('categories', [])}")
    for s in services[:6]:
        prov = s.get('province', 'national')
        prov_tag = "全国通用" if prov == 'national' else f"{prov}专属"
        cross_tag = "✓ 跨省路由" if s.get('code') in ['medical_record', 'social_transfer', 'unemployment'] else "         "
        print(f"  {cross_tag} [{s.get('code')}] {s.get('name')} ({prov_tag})")

# 5. 测试待办事项
print("\n5. 测试待办事项 API")
print("-" * 40)
resp = requests.get(f"{BASE_URL}/home/todos", headers=headers, timeout=10)
result = resp.json()
print(f"响应码: {result.get('code')}")
if result.get("data"):
    print(f"待办数: {len(result['data'].get('todos', []))}")
    print(f"未读通知: {result['data'].get('unread_notifications')}")
    print(f"待办服务: {result['data'].get('pending_services')}")

# 6. 测试服务记录追溯
print("\n6. 测试服务记录追溯")
print("-" * 40)
resp = requests.get(f"{BASE_URL}/services/records", headers=headers, timeout=10)
result = resp.json()
print(f"响应码: {result.get('code')}")
if result.get("data"):
    records = result["data"]["list"]
    print(f"总记录数: {result['data'].get('total')}")
    print(f"当前页记录: {len(records)}")
    if records:
        for r in records[:3]:
            status_map = {'pending': '⏳ 处理中', 'completed': '✅ 已完成', 'failed': '❌ 失败'}
            status = status_map.get(r.get('status'), r.get('status'))
            print(f"  [{status}] {r.get('service_name')} (trace_id: {r.get('trace_id')[:12]}...)")

# 7. 测试 admin 登录错误反馈
print("\n7. 测试多角色登录错误反馈")
print("-" * 40)

# admin 登录
resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": "admin", "password": "123456"}, timeout=10)
result = resp.json()
print(f"admin 登录: code={result.get('code')}, msg={result.get('message')}")

# platform 登录
resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": "platform", "password": "123456"}, timeout=10)
result = resp.json()
print(f"platform 登录: code={result.get('code')}, msg={result.get('message')}")

# ops 登录
resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": "ops", "password": "123456"}, timeout=10)
result = resp.json()
print(f"ops 登录: code={result.get('code')}, msg={result.get('message')}")

# 8. 测试错误场景反馈
print("\n8. 测试错误场景反馈")
print("-" * 40)

# 错误密码
resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": "13800138000", "password": "wrong"}, timeout=10)
result = resp.json()
print(f"错误密码: code={result.get('code')}, msg={result.get('message')}")

# 用户不存在
resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": "12345678901", "password": "123456"}, timeout=10)
result = resp.json()
print(f"用户不存在: code={result.get('code')}, msg={result.get('message')}")

# 9. 测试登出
print("\n9. 测试登出")
print("-" * 40)
resp = requests.post(f"{BASE_URL}/auth/logout", headers=headers, timeout=10)
result = resp.json()
print(f"登出响应: code={result.get('code')}, msg={result.get('message')}")

# 10. 测试已登出 token 访问
print("\n10. 测试登出后 token 有效性")
print("-" * 40)
resp = requests.get(f"{BASE_URL}/home", headers=headers, timeout=10)
result = resp.json()
print(f"已登出访问首页: code={result.get('code')}, msg={result.get('message')}")

print("\n" + "=" * 60)
print("API 全链路测试完成")
print("=" * 60)
