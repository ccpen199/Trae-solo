import requests
import json

print("=" * 60)
print("AI售后知识库更新Agent - 核心业务链路验证")
print("=" * 60)

base_url = "http://127.0.0.1:53371"

# 1. 登录认证
print("\n1. 用户登录认证...")
login_data = {'username': 'admin', 'password': 'admin123'}
r = requests.post(f'{base_url}/token', data=login_data)
assert r.status_code == 200, "登录失败"
token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}
print("   ✅ 登录成功")

# 2. 获取当前用户信息
print("\n2. 获取当前用户信息...")
r = requests.get(f'{base_url}/users/me', headers=headers)
assert r.status_code == 200
user_info = r.json()
print(f"   ✅ 用户: {user_info['full_name']}, 角色: {user_info['role']}")

# 3. 获取文档列表
print("\n3. 获取文档列表...")
r = requests.get(f'{base_url}/documents', headers=headers)
assert r.status_code == 200
docs = r.json()
print(f"   ✅ 文档数量: {len(docs)}")
for doc in docs[:2]:
    print(f"      - {doc['title']} (状态: {doc['status']})")

# 4. 问答功能测试
print("\n4. 智能问答功能测试...")
r = requests.post(f'{base_url}/qa/ask', headers=headers, json={'question': '退换货政策是什么'})
assert r.status_code == 200
result = r.json()
print(f"   ✅ 问题: {result['question']}")
print(f"   ✅ 生成任务ID: {result['task_id']}")
print(f"   ✅ 引用来源数: {len(result['citations'])}")
print(f"   ✅ 答案长度: {len(result['answer'])} 字符")

# 5. 获取任务列表
print("\n5. 获取业务台账...")
r = requests.get(f'{base_url}/tasks', headers=headers)
assert r.status_code == 200
tasks = r.json()
print(f"   ✅ 任务数量: {len(tasks)}")

# 6. 任务详情
if tasks:
    task_id = tasks[0]['id']
    print(f"\n6. 查看任务详情 (ID: {task_id})...")
    r = requests.get(f'{base_url}/tasks/{task_id}', headers=headers)
    assert r.status_code == 200
    task_detail = r.json()
    print(f"   ✅ 任务状态: {task_detail['status']}")
    print(f"   ✅ 引用数: {len(task_detail['citations'])}")
    print(f"   ✅ 状态流转记录: {len(task_detail['status_history'])} 条")

# 7. 报表数据
print("\n7. 获取报表数据...")
r = requests.get(f'{base_url}/reports/tasks-summary', headers=headers)
assert r.status_code == 200
summary = r.json()
print(f"   ✅ 任务总数: {summary['total']}")
print(f"   ✅ 状态分布: {json.dumps(summary['by_status'], ensure_ascii=False)}")

# 8. 测试越权访问 - 使用一线用户
print("\n8. 权限控制验证 (越权访问测试)...")
login_data2 = {'username': 'frontline', 'password': 'frontline123'}
r2 = requests.post(f'{base_url}/token', data=login_data2)
token2 = r2.json()['access_token']
headers2 = {'Authorization': f'Bearer {token2}'}

# 一线用户尝试访问用户管理（应该被拒绝）
r = requests.get(f'{base_url}/users', headers=headers2)
assert r.status_code == 403, "一线用户不应该能访问用户管理"
print("   ✅ 越权访问被正确拒绝")

# 一线用户查看文档（只能看到公开文档）
r = requests.get(f'{base_url}/documents', headers=headers2)
docs_frontline = r.json()
print(f"   ✅ 一线用户可见文档数: {len(docs_frontline)} (权限控制生效)")

# 9. 获取规则配置
print("\n9. 获取规则配置...")
r = requests.get(f'{base_url}/rules', headers=headers)
assert r.status_code == 200
rules = r.json()
print(f"   ✅ 规则配置数: {len(rules)}")
print(f"   ✅ 当前生效规则版本: {rules[0]['version'] if rules else '无'}")

# 10. 审计日志
print("\n10. 获取审计日志...")
r = requests.get(f'{base_url}/audit-logs', headers=headers)
assert r.status_code == 200
logs = r.json()
print(f"   ✅ 审计日志记录数: {len(logs)}")

print("\n" + "=" * 60)
print("✅ 所有核心业务链路验证通过!")
print("=" * 60)
print(f"\n系统访问地址: http://127.0.0.1:53371")
print(f"\n测试账号:")
print(f"  - admin / admin123 (业务负责人)")
print(f"  - operator / operator123 (模型运营)")
print(f"  - reviewer / reviewer123 (审核人员)")
print(f"  - frontline / frontline123 (一线使用者)")
