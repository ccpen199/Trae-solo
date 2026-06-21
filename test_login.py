import urllib.request
import json

print("=" * 60)
print("登录API测试")
print("=" * 60)

test_cases = [
    {
        'name': '✅ 学生正确登录',
        'data': {'account': '2021001', 'password': 'student123', 'role': 'student'},
        'expect_success': True
    },
    {
        'name': '✅ 投资商正确登录',
        'data': {'account': 'investor', 'password': 'invest123', 'role': 'investor'},
        'expect_success': True
    },
    {
        'name': '✅ 管理员正确登录',
        'data': {'account': 'admin', 'password': 'admin123', 'role': 'admin'},
        'expect_success': True
    },
    {
        'name': '❌ 学生错误密码',
        'data': {'account': '2021001', 'password': 'wrongpass', 'role': 'student'},
        'expect_success': False
    },
    {
        'name': '❌ 不存在账号',
        'data': {'account': 'nonexist', 'password': 'student123', 'role': 'student'},
        'expect_success': False
    },
    {
        'name': '❌ 角色不匹配',
        'data': {'account': '2021001', 'password': 'student123', 'role': 'investor'},
        'expect_success': False
    },
    {
        'name': '❌ 缺少参数',
        'data': {'account': '2021001'},
        'expect_success': False
    },
]

passed = 0
failed = 0

for test in test_cases:
    print(f"\n{test['name']}")
    print("-" * 40)
    
    try:
        data = json.dumps(test['data']).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:3002/api/auth/login',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            status = resp.status
            
        success = result['code'] == 200
        expected = test['expect_success']
        
        print(f"HTTP状态: {status}")
        print(f"业务码: {result['code']}")
        print(f"消息: {result['message']}")
        
        if success and 'data' in result and result['data']:
            print(f"用户: {result['data']['user']['name']}")
            print(f"角色: {result['data']['user']['role']}")
            print(f"Token: {result['data']['token'][:30]}...")
        
        if success == expected:
            print("✅ 测试通过")
            passed += 1
        else:
            print(f"❌ 测试失败 - 预期{'成功' if expected else '失败'}，实际{'成功' if success else '失败'}")
            failed += 1
            
    except urllib.error.HTTPError as e:
        result = json.loads(e.read().decode('utf-8'))
        print(f"HTTP状态: {e.code}")
        print(f"业务码: {result['code']}")
        print(f"消息: {result['message']}")
        
        expected = test['expect_success']
        if not expected:
            print("✅ 测试通过 (正确返回错误)")
            passed += 1
        else:
            print("❌ 测试失败 - 预期成功但返回错误")
            failed += 1
            
    except Exception as e:
        print(f"❌ 异常: {e}")
        failed += 1

print("\n" + "=" * 60)
print(f"测试结果: {passed} 通过, {failed} 失败")
print("=" * 60)
