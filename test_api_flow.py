import urllib.request
import urllib.error
import json

print("=" * 70)
print("  测试后端登录 API（直接访问后端端口）")
print("=" * 70)

# 1. 直接访问后端
print("\n1. POST http://127.0.0.1:59013/api/auth/login (admin/admin123)")
try:
    url = "http://127.0.0.1:59013/api/auth/login"
    data = json.dumps({"phone": "admin", "password": "admin123"}).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=5) as resp:
        result = json.loads(resp.read().decode())
        print(f"   HTTP {resp.status}")
        print(f"   code={result.get('code')}")
        print(f"   message={result.get('message')}")
        if result.get('code') == 0:
            data_obj = result.get('data', {})
            print(f"   data.token: {str(data_obj.get('token'))[:30]}...")
            print(f"   data.rider.name: {data_obj.get('rider', {}).get('name')}")
            print(f"   data.rider.role: {data_obj.get('rider', {}).get('role')}")
except Exception as e:
    print(f"   ❌ 错误: {e}")

print("\n2. POST http://127.0.0.1:59013/api/auth/login (admin/wrong)")
try:
    url = "http://127.0.0.1:59013/api/auth/login"
    data = json.dumps({"phone": "admin", "password": "wrong"}).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=5) as resp:
        result = json.loads(resp.read().decode())
        print(f"   HTTP {resp.status}")
        print(f"   code={result.get('code')}")
        print(f"   message={result.get('message')}")
except urllib.error.HTTPError as e:
    print(f"   HTTP {e.code}")
    content = e.read().decode()
    result = json.loads(content) if content else {}
    print(f"   code={result.get('code')}")
    print(f"   message={result.get('message')}")

print("\n" + "=" * 70)
print("  测试通过前端代理")
print("=" * 70)

print("\n3. POST http://127.0.0.1:49013/api/auth/login (admin/admin123)")
try:
    url = "http://127.0.0.1:49013/api/auth/login"
    data = json.dumps({"phone": "admin", "password": "admin123"}).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=5) as resp:
        result = json.loads(resp.read().decode())
        print(f"   HTTP {resp.status}")
        print(f"   code={result.get('code')}")
        print(f"   message={result.get('message')}")
        if result.get('code') == 0:
            data_obj = result.get('data', {})
            print(f"   data.token: {str(data_obj.get('token'))[:30]}...")
            print(f"   data.rider.name: {data_obj.get('rider', {}).get('name')}")
            print(f"   data.rider.role: {data_obj.get('rider', {}).get('role')}")
except Exception as e:
    print(f"   ❌ 错误: {e}")

print("\n4. 检查后端日志（确认请求到达）")
with open("/Users/chen/Documents/trae_projects/local_projects/may-89013/backend.log", "r") as f:
    lines = f.readlines()
    print(f"   后端日志共 {len(lines)} 行")

print("\n" + "=" * 70)
