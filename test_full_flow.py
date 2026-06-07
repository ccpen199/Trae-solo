import requests
import json

BASE_URL = "http://127.0.0.1:58945/api"

def test_login(phone, password, desc):
    print(f"\n=== {desc} ===")
    try:
        r = requests.post(f"{BASE_URL}/auth/login", 
                         json={"phone": phone, "password": password},
                         timeout=5)
        print(f"HTTP {r.status_code}")
        data = r.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_api_with_auth(token, path, desc, method="GET", params=None):
    print(f"\n=== {desc} ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        if method == "GET":
            r = requests.get(f"{BASE_URL}{path}", headers=headers, params=params, timeout=5)
        else:
            r = requests.post(f"{BASE_URL}{path}", headers=headers, json=params, timeout=5)
        print(f"HTTP {r.status_code}")
        if r.status_code == 200:
            try:
                data = r.json()
                if isinstance(data, list):
                    print(f"返回 {len(data)} 条记录")
                    if data:
                        print(f"第一条: {json.dumps(data[0], indent=2, ensure_ascii=False)[:200]}...")
                elif isinstance(data, dict):
                    print(f"keys: {list(data.keys())[:10]}")
                    print(json.dumps(data, indent=2, ensure_ascii=False)[:300])
            except:
                print(r.text[:200])
        return r.status_code
    except Exception as e:
        print(f"Error: {e}")
        return 500

print("=" * 60)
print("建行本地生活服务中台 - 全链路验证")
print("=" * 60)

# 1. 失败反馈测试
print("\n" + "=" * 40)
print("一、失败反馈验证")
print("=" * 40)

test_login("123", "123", "参数错误：手机号格式不对")
test_login("13999999999", "wrong123", "账号不存在")
test_login("13800000001", "wrong123", "密码错误")

# 2. 三种角色登录测试
print("\n" + "=" * 40)
print("二、三种角色登录链路")
print("=" * 40)

admin_data = test_login("13800000001", "admin123", "审核运营(admin)登录")
merchant_data = test_login("13800000002", "merchant123", "商户运营(merchant)登录")
user_data = test_login("13800000003", "user123", "普通用户(user)登录")

# 3. 业务页面API测试（用admin token）
print("\n" + "=" * 40)
print("三、业务页面API承接验证 (admin角色)")
print("=" * 40)

if admin_data and 'token' in admin_data:
    token = admin_data['token']
    test_api_with_auth(token, "/providers", "1. 服务商审核列表", params={"status": "pending"})
    test_api_with_auth(token, "/fee-config", "2. 费率配置列表")
    test_api_with_auth(token, "/arbitrations", "3. 仲裁工单列表")
    test_api_with_auth(token, "/reports/gmv", "4. 数据报表-GMV", params={"startDate": "2026-06-01", "endDate": "2026-06-03"})
    test_api_with_auth(token, "/risk-events/events", "5. 风控事件记录")
    test_api_with_auth(token, "/products", "6. 商品上架列表")
    test_api_with_auth(token, "/orders", "7. 订单履约列表")
    test_api_with_auth(token, "/users", "8. 用户列表")

# 4. 免绑卡用户验证
print("\n" + "=" * 40)
print("四、免绑卡用户业务闭环验证")
print("=" * 40)

if user_data and 'token' in user_data:
    token = user_data['token']
    print(f"用户角色: {user_data['user']['role']}")
    print(f"是否绑卡: {user_data['user']['hasBankCard']}")
    print(f"是否实名: {user_data['user']['idCardVerified']}")
    print(f"钱包余额: {user_data['user']['walletBalance']}")
    print(f"工作台路径: {user_data['workbenchPath']}")
    print(f"权限: {user_data['permissions']}")
    
    test_api_with_auth(token, "/orders", "用户订单查询")
    test_api_with_auth(token, "/products", "商品浏览")

print("\n" + "=" * 60)
print("验证完成")
print("=" * 60)
