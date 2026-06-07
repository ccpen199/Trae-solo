#!/usr/bin/env python3
import requests
import json

API_BASE = "http://127.0.0.1:59060/api"

def test_dashboard(username, password, role_name):
    print(f"\n{'='*60}")
    print(f"测试 {role_name} 登录后工作台功能")
    print("="*60)
    
    # 登录
    r = requests.post(f"{API_BASE}/auth/login", json={"username": username, "password": password})
    if not r.json().get("success"):
        print(f"❌ 登录失败: {r.json().get('error')}")
        return False
    token = r.json()["token"]
    user = r.json()["user"]
    print(f"✅ 登录成功: {user['name']} ({user['role']})")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试各业务模块
    tests = [
        ("房源管理", f"{API_BASE}/houses?page=1&pageSize=3"),
        ("客源管理", f"{API_BASE}/clients?page=1&pageSize=3"),
        ("带看日程", f"{API_BASE}/schedules"),
        ("交易看板", f"{API_BASE}/transactions?page=1&pageSize=3"),
        ("佣金台账", f"{API_BASE}/commissions?page=1&pageSize=3"),
    ]
    
    # 特殊权限测试
    if user["role"] in ["director", "admin", "platform"]:
        tests.append(("审计日志", f"{API_BASE}/audit/logs?page=1&pageSize=3"))
    
    if user["role"] in ["director", "manager", "admin"]:
        tests.append(("组织管理", f"{API_BASE}/orgs/tree"))
    
    all_pass = True
    for name, url in tests:
        try:
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200 and r.json().get("success"):
                total = r.json().get("total", len(r.json().get("data", [])))
                print(f"✅ {name}: {r.status_code}, 数据={total}条")
            elif r.status_code == 403:
                print(f"⚠️  {name}: {r.status_code} 权限不足 (预期行为)")
            else:
                print(f"❌ {name}: {r.status_code} {r.json().get('error', '')}")
                all_pass = False
        except Exception as e:
            print(f"❌ {name}: 异常 {e}")
            all_pass = False
    
    return all_pass

print("="*60)
print("鼎信地产 - 登录后业务工作台功能验证")
print("="*60)

results = []
results.append(test_dashboard("admin", "123456", "系统管理员"))
results.append(test_dashboard("platform", "123456", "平台运营"))
results.append(test_dashboard("ops", "123456", "运维工程师"))
results.append(test_dashboard("director", "123456", "总监"))
results.append(test_dashboard("manager", "123456", "店长"))
results.append(test_dashboard("agent1", "123456", "经纪人"))

print("\n" + "="*60)
print("📊 汇总")
print("="*60)
passed = sum(1 for r in results if r)
print(f"✅ {passed}/{len(results)} 角色工作台功能验证通过")
print("="*60)
