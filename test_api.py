#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import sys

BACKEND = "http://127.0.0.1:60079"
FRONTEND = "http://127.0.0.1:50079"

def print_section(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}\n")

def test_health():
    print_section("1. 后端健康检查")
    try:
        req = urllib.request.Request(f"{BACKEND}/api/health")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            print(f"Response: {json.dumps(data, ensure_ascii=False)}")
            return data.get('success', False)
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_frontend():
    print_section("2. 前端健康检查")
    try:
        req = urllib.request.Request(f"{FRONTEND}/")
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"Status: {resp.status}")
            return resp.status == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login(id_card, password, role):
    print_section(f"3. {role}登录")
    try:
        data = json.dumps({'idCard': id_card, 'password': password}).encode()
        req = urllib.request.Request(
            f"{BACKEND}/api/auth/login",
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            print(f"Response: {json.dumps(result, ensure_ascii=False, indent=2)[:600]}")
            if result.get('success'):
                return result['data'].get('token', '')
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Response: {e.read().decode()}")
    except Exception as e:
        print(f"Error: {e}")
    return ''

def test_with_auth(url, method='GET', data=None, token=None, desc=''):
    print_section(desc)
    try:
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(
            f"{BACKEND}{url}",
            data=body,
            headers=headers,
            method=method
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            print(f"Response: {json.dumps(result, ensure_ascii=False, indent=2)[:800]}")
            return result
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Response: {e.read().decode()[:500]}")
    except Exception as e:
        print(f"Error: {e}")
    return None

def main():
    print("=" * 60)
    print("  湖南省社保费税务征缴一体化服务平台 - API测试")
    print("=" * 60)

    results = []

    # 基础健康检查
    results.append(('后端健康', test_health()))
    results.append(('前端健康', test_frontend()))

    # 居民用户测试
    token = test_login('430101199001011234', '123456', '居民用户')
    if token:
        print(f"\nToken: {token[:60]}...")
        results.append(('居民登录', True))
        results.append(('用户信息', test_with_auth('/api/user/profile', 'GET', None, token, '4. 获取用户信息') is not None))
        results.append(('参保信息', test_with_auth('/api/insurance', 'GET', None, token, '5. 获取参保信息') is not None))
        results.append(('缴费订单', test_with_auth('/api/payment/orders', 'GET', None, token, '6. 获取缴费订单') is not None))
        results.append(('创建订单', test_with_auth('/api/payment/create-order', 'POST',
            {'insuranceType': 'pension', 'payYear': 2026, 'payGrade': 300, 'channel': 'alipay'},
            token, '7. 创建缴费订单') is not None))
        results.append(('家庭共济', test_with_auth('/api/family/members', 'GET', None, token, '8. 获取家庭共济成员') is not None))
        results.append(('养老金发放', test_with_auth('/api/benefit/pension', 'GET', None, token, '9. 获取养老金发放') is not None))
        results.append(('养老金测算', test_with_auth('/api/calculator/pension-estimate', 'POST',
            {'payYears': 30, 'payGrade': 500, 'retireAge': 60, 'currentAge': 30},
            token, '10. 养老金测算') is not None))
    else:
        results.append(('居民登录', False))
        print("居民登录失败，跳过后续测试")

    # 管理员测试
    admin_token = test_login('430101198001019999', '123456', '税务管理员')
    if admin_token:
        print(f"\nAdmin Token: {admin_token[:60]}...")
        results.append(('管理员登录', True))
        results.append(('预警列表', test_with_auth('/api/admin/warnings', 'GET', None, admin_token, '11. 获取预警列表') is not None))
        results.append(('稽核规则', test_with_auth('/api/admin/audit-rules', 'GET', None, admin_token, '12. 获取稽核规则') is not None))
        results.append(('数据比对', test_with_auth('/api/admin/datashare/compare', 'GET', None, admin_token, '13. 跨部门数据比对') is not None))
    else:
        results.append(('管理员登录', False))
        print("管理员登录失败，跳过后续测试")

    # 汇总结果
    print_section("测试结果汇总")
    passed = sum(1 for _, ok in results if ok)
    total = len(results)
    for name, ok in results:
        status = "✅ 通过" if ok else "❌ 失败"
        print(f"  {name}: {status}")
    print(f"\n总计: {passed}/{total} 测试通过")

    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
