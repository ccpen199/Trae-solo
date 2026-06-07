#!/usr/bin/env python3
import requests
import json

API_BASE = "http://127.0.0.1:59060/api"

def test_login(username, password, desc):
    print(f"\n{'='*60}")
    print(f"测试: {desc}")
    print(f"  账号: {username}, 密码: {password}")
    print(f"{'-'*60}")
    try:
        r = requests.post(
            f"{API_BASE}/auth/login",
            json={"username": username, "password": password},
            timeout=5
        )
        print(f"  HTTP状态: {r.status_code}")
        print(f"  响应: {json.dumps(r.json(), ensure_ascii=False, indent=2)}")
        return r.json()
    except Exception as e:
        print(f"  错误: {e}")
        return None

print("="*60)
print("鼎信地产登录 API 完整测试")
print("="*60)

results = []

# 错误场景测试
print("\n" + "="*60)
print("🔴 错误场景测试")
results.append(("账号不存在", test_login("nonexistent", "123456", "账号不存在")))
results.append(("缺少密码", test_login("admin", "", "缺少密码")))
results.append(("密码错误", test_login("admin", "wrongpass", "密码错误")))

# 成功登录测试
print("\n" + "="*60)
print("🟢 成功登录测试")
results.append(("admin", test_login("admin", "123456", "admin 系统管理员")))
results.append(("platform", test_login("platform", "123456", "platform 平台运营")))
results.append(("ops", test_login("ops", "123456", "ops 运维工程师")))
results.append(("director", test_login("director", "123456", "director 总监")))
results.append(("manager", test_login("manager", "123456", "manager 店长")))
results.append(("agent1", test_login("agent1", "123456", "agent1 经纪人")))
results.append(("agent2", test_login("agent2", "123456", "agent2 经纪人-待认证")))

# 汇总
print("\n" + "="*60)
print("📊 测试结果汇总")
print("="*60)
passed = 0
failed = 0
for name, res in results:
    if res is None:
        status = "❌ 异常"
        failed += 1
    elif res.get("success"):
        status = f"✅ 成功 (role={res.get('user',{}).get('role','N/A')})"
        passed += 1
    else:
        status = f"❌ 失败 (code={res.get('code','N/A')})"
        failed += 1
    print(f"  {name:<20} {status}")

print(f"\n总计: {passed+failed} 测试, ✅ {passed} 通过, ❌ {failed} 失败")
print("="*60)

# 验证错误码区分
print("\n" + "="*60)
print("🔍 错误码区分验证")
print("="*60)
error_codes = set()
for name, res in results:
    if res and not res.get("success"):
        code = res.get("code", "NONE")
        error_codes.add(code)
        print(f"  {name:<20} code={code:<25} msg={res.get('error','')}")

print(f"\n检测到 {len(error_codes)} 种不同错误码: {sorted(error_codes)}")
print("="*60)
