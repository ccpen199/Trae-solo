#!/usr/bin/env python3
"""完全模拟前端登录请求流程"""
import requests
import json
import sys

FRONTEND_URL = "http://127.0.0.1:49060"
BACKEND_URL = "http://127.0.0.1:59060"

def simulate_frontend_login(username, password):
    """模拟前端 api.post 的行为：先 JSON.stringify body，再通过 Vite 代理发送"""
    print(f"\n{'='*60}")
    print(f"模拟前端登录: {username} / {password}")
    print(f"{'='*60}")
    
    # 模拟 api.post: JSON.stringify body
    body = {"username": username, "password": password}
    json_body = json.dumps(body)  # 前端 api.post 会做这一步
    print(f"1. JSON.stringify 后的 body: {json_body}")
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    
    # 2. 通过前端代理发送请求 (模拟浏览器行为)
    print(f"2. 通过前端代理发送 POST 到: {FRONTEND_URL}/api/auth/login")
    try:
        r = requests.post(
            f"{FRONTEND_URL}/api/auth/login",
            data=json_body,  # 注意: 用 data 而不是 json, 因为已经 stringify 了
            headers=headers,
            timeout=5
        )
        
        print(f"3. HTTP 状态: {r.status_code}")
        print(f"4. 响应头 Content-Type: {r.headers.get('Content-Type', '')}")
        
        try:
            data = r.json()
            print(f"5. 响应内容:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
            
            # 检查字段
            if not r.ok:
                print(f"\n🔍 错误字段检查:")
                print(f"   code: {data.get('code', 'MISSING!')}")
                print(f"   role: {data.get('role', 'MISSING!')}")
                print(f"   error: {data.get('error', 'MISSING!')}")
                
                if 'code' in data and 'role' in data:
                    print(f"\n✅ 修复成功！code 和 role 字段都存在")
                else:
                    print(f"\n❌ 修复未生效！缺少字段")
            else:
                print(f"\n🔍 成功字段检查:")
                print(f"   success: {data.get('success')}")
                print(f"   has token: {'token' in data and data['token']}")
                print(f"   has user: {'user' in data and data['user']}")
                if 'user' in data:
                    print(f"   user.role: {data['user'].get('role', 'N/A')}")
            
            return data
        except Exception as e:
            print(f"5. 解析响应失败: {e}")
            print(f"   原始响应: {r.text[:500]}")
            return None
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return None

# 测试用例
print("="*60)
print("模拟前端登录流程测试")
print("="*60)

# 测试 1: admin 正确密码
simulate_frontend_login("admin", "123456")

# 测试 2: admin 错误密码
simulate_frontend_login("admin", "wrongpass")

# 测试 3: 账号不存在
simulate_frontend_login("nonexistent", "123456")

# 测试 4: platform 正确密码
simulate_frontend_login("platform", "123456")

# 测试 5: ops 正确密码
simulate_frontend_login("ops", "123456")

print("\n" + "="*60)
print("测试完成")
print("="*60)
