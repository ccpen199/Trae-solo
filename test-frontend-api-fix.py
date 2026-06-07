#!/usr/bin/env python3
"""模拟前端 api.ts 的 request 函数逻辑，验证修复是否正确"""
import requests
import json

BASE_URL = "http://127.0.0.1:59060/api"

def simulate_frontend_request(url, method="GET", body=None):
    """模拟前端 api.ts 的 request 函数"""
    headers = {"Content-Type": "application/json"}
    full_url = f"{BASE_URL}{url}"
    
    try:
        if method == "POST":
            response = requests.post(full_url, json=body, headers=headers)
        else:
            response = requests.get(full_url, headers=headers)
        
        data = response.json()
        
        # 这是修复前的代码（丢失 code 和 role）
        if not response.ok:
            old_result = {
                "success": False,
                "error": data.get("error", f"请求失败: {response.status_code}")
            }
        else:
            old_result = data
        
        # 这是修复后的代码（保留所有字段）
        if not response.ok:
            new_result = {
                "success": False,
                **data,
                "error": data.get("error", f"请求失败: {response.status_code}")
            }
        else:
            new_result = data
        
        return {
            "status": response.status_code,
            "old_behavior": old_result,
            "new_behavior": new_result,
            "raw_response": data
        }
    except Exception as e:
        return {"error": str(e)}

print("="*70)
print("测试前端 API 客户端修复前后对比")
print("="*70)

test_cases = [
    ("admin 密码错误", "/auth/login", "POST", {"username": "admin", "password": "wrongpass"}),
    ("账号不存在", "/auth/login", "POST", {"username": "nonexistent", "password": "123456"}),
    ("缺少密码", "/auth/login", "POST", {"username": "admin"}),
    ("admin 登录成功", "/auth/login", "POST", {"username": "admin", "password": "123456"}),
    ("platform 登录成功", "/auth/login", "POST", {"username": "platform", "password": "123456"}),
    ("ops 登录成功", "/auth/login", "POST", {"username": "ops", "password": "123456"}),
]

for desc, url, method, body in test_cases:
    print(f"\n{'-'*70}")
    print(f"测试: {desc}")
    print(f"{'-'*70}")
    
    result = simulate_frontend_request(url, method, body)
    
    if "error" in result:
        print(f"❌ 请求异常: {result['error']}")
        continue
    
    print(f"HTTP 状态: {result['status']}")
    
    old = result["old_behavior"]
    new = result["new_behavior"]
    
    print(f"\n🔴 修复前（旧行为）:")
    print(f"  success: {old.get('success')}")
    print(f"  error: {old.get('error')}")
    print(f"  code: {old.get('code', 'MISSING!')}")
    print(f"  role: {old.get('role', 'MISSING!')}")
    
    print(f"\n🟢 修复后（新行为）:")
    print(f"  success: {new.get('success')}")
    print(f"  error: {new.get('error')}")
    print(f"  code: {new.get('code', 'MISSING!')}")
    print(f"  role: {new.get('role', 'MISSING!')}")
    if new.get('message'):
        print(f"  message: {new.get('message')}")
    
    # 检查修复是否有效
    if not new.get('success'):
        old_has_code = 'code' in old
        new_has_code = 'code' in new
        if not old_has_code and new_has_code:
            print(f"\n✅ 修复成功！旧版本丢失 code，新版本正确返回")
        elif old_has_code and new_has_code:
            print(f"\nℹ️  字段正确返回")
        else:
            print(f"\n⚠️  仍然缺少字段")

print("\n" + "="*70)
print("测试完成")
print("="*70)
