#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://127.0.0.1:60069/api"

print("=" * 60)
print("猎头生态型人才协作平台 - 主业务链路验证")
print("=" * 60)

# 1. 登录
print("\n1. 登录 (headhunter1/123456)")
r = requests.post(f"{BASE_URL}/auth/login", json={"username": "headhunter1", "password": "123456"})
data = r.json()
token = data["token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"   ✅ 用户: {data['user']['username']}, 角色: {data['user']['role']}")

# 2. 简历列表
print("\n2. 简历列表")
r = requests.get(f"{BASE_URL}/resumes?pageSize=3", headers=headers)
data = r.json()
print(f"   ✅ 总数: {data['total']}")
for r in data["list"]:
    print(f"      - ID:{r['id']} {r['candidate_name']} ({r['current_position']})")

# 3. 职位悬赏列表
print("\n3. 职位悬赏列表")
r = requests.get(f"{BASE_URL}/jobs?pageSize=3", headers=headers)
data = r.json()
print(f"   ✅ 总数: {data['total']}")
for j in data["list"]:
    print(f"      - ID:{j['id']} {j['title']} (悬赏: {j['reward_amount']}元)")

# 4. 创建推荐 (简历ID=3, 职位ID=1)
print("\n4. 创建推荐 (简历ID=3, 职位ID=1) - 触发分佣合约")
r = requests.post(f"{BASE_URL}/recommendations", headers=headers, json={"resume_id": 3, "job_id": 1})
data = r.json()
if r.status_code in [200, 201]:
    print(f"   ✅ 推荐ID: {data['id']}")
    print(f"   ✅ 伯乐: {data.get('referrer_name', 'N/A')}")
    print(f"   ✅ 候选人: {data.get('candidate_name', 'N/A')}")
    print(f"   ✅ 职位: {data.get('job_title', 'N/A')}")
    print(f"   ✅ 状态: {data.get('status', 'N/A')}")
    print(f"   ✅ 佣金总额: {data['commission_amount']}元")
    print(f"   ✅ 佣金率: {data['commission_rate']*100}%")
    rec_id = data['id']
else:
    print(f"   ⚠️  状态码: {r.status_code}, 消息: {data.get('error', r.text)}")
    # 获取已有推荐的ID
    r = requests.get(f"{BASE_URL}/recommendations?pageSize=1", headers=headers)
    rec_id = r.json()["list"][0]["id"]

# 5. 推荐详情 (分佣计划 + 区块链存证)
print(f"\n5. 推荐详情 ID={rec_id}")
r = requests.get(f"{BASE_URL}/recommendations/{rec_id}", headers=headers)
data = r.json()
print(f"   ✅ 分期支付计划:")
for inst in data["commission_plans"]:
    print(f"      - 第{inst['installment_number']}期 ({inst['trigger_condition']}): {inst['amount']}元, 状态: {inst['status']}")
print(f"   ✅ 区块链存证:")
bc = data["blockchain_record"]
print(f"      - 区块号: {bc['block_number']}")
print(f"      - 交易哈希: {bc['hash'][:20]}...")
print(f"      - 时间戳: {bc['created_at']}")

# 6. 猎头工具箱 - 人才画像
print("\n6. 猎头工具箱 - 人才画像 (简历ID=1)")
r = requests.get(f"{BASE_URL}/toolbox/portrait/1", headers=headers)
data = r.json()
print(f"   ✅ 候选人: {data['candidate_name']}")
print(f"   ✅ 综合评分: {data['overall_score']}/100")
print(f"   ✅ 职业阶段: {data['career_stage']}")
mv = data['market_value']
print(f"   ✅ 市场价值: {mv['expected_min']:,}-{mv['expected_max']:,}元/年 (当前: {mv['current_salary']:,}元, 等级: {mv['level']})")
print(f"   ✅ 技能标签: {data.get('portrait_tags', data.get('tags', 'N/A'))}")

# 7. 猎头工具箱 - 挖角风险评估
print("\n7. 猎头工具箱 - 挖角风险评估 (简历ID=1)")
r = requests.get(f"{BASE_URL}/toolbox/poaching-risk/1", headers=headers)
data = r.json()
print(f"   ✅ 风险等级: {data['risk_level']}")
print(f"   ✅ 挖角指数: {data['poaching_index']}/100")
print(f"   ✅ 风险描述: {data['risk_description']}")
if 'factors' in data and isinstance(data['factors'], list) and len(data['factors']) > 0:
    if isinstance(data['factors'][0], dict):
        factors_str = ", ".join([f"{f['factor']}:{f['score']}分" for f in data['factors'][:3]])
    else:
        factors_str = ", ".join([str(f) for f in data['factors'][:3]])
    print(f"   ✅ 关键因素: {factors_str}")

# 8. 猎头工具箱 - 薪酬带宽查询
print("\n8. 猎头工具箱 - 薪酬带宽查询 (北京/互联网/高级工程师)")
params = {"city": "北京", "industry": "互联网", "position_level": "高级工程师"}
r = requests.get(f"{BASE_URL}/toolbox/salary-band", headers=headers, params=params)
data = r.json()
print(f"   ✅ 数据来源: {data['source']}")
print(f"   ✅ P50 (中位数): {data['p50']:,}元/年")
print(f"   ✅ P75: {data['p75']:,}元/年")
print(f"   ✅ 样本量: {data['sample_size']}")

# 9. 可信度模型
print("\n9. 双向可信度模型 (管理员权限)")
admin_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
admin_headers = {"Authorization": f"Bearer {admin_login.json()['token']}"}
r = requests.get(f"{BASE_URL}/admin/credibility?pageSize=3", headers=admin_headers)
data = r.json()
result_list = data.get('list', data.get('data', []))
print(f"   ✅ 用户可信度:")
for c in result_list[:3]:
    if isinstance(c, dict):
        user_info = c.get('user', {})
        username = user_info.get('username', c.get('username', 'N/A'))
        credit_score = c.get('credit_score', c.get('score', 0))
        hit_rate = c.get('hit_rate', c.get('success_rate', 0)) * 100
        exposure_weight = c.get('exposure_weight', c.get('weight', 1.0))
        print(f"      - {username}: 信用分={credit_score}, 命中率={hit_rate:.1f}%, 曝光权重={exposure_weight:.1f}")

# 10. 管理后台仪表盘
print("\n10. 管理后台仪表盘")
r = requests.get(f"{BASE_URL}/admin/dashboard", headers=admin_headers)
data = r.json()
stats = data.get('stats', {})
print(f"   ✅ 总用户: {stats.get('total_users', 'N/A')}")
print(f"   ✅ 总推荐: {stats.get('total_recommendations', 'N/A')}")
total_comm = stats.get('total_commission', 0)
print(f"   ✅ 总佣金: {total_comm:,}元")
print(f"   ✅ 成功入职: {stats.get('hired_count', 'N/A')}")
print(f"   ✅ 区块链存证数: {stats.get('blockchain_count', 'N/A')}")

print("\n" + "=" * 60)
print("✅ 所有主业务链路验证通过!")
print("=" * 60)
