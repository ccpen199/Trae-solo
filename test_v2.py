#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://127.0.0.1:59069/api"

def login(username, password):
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password}, timeout=5)
        if r.status_code == 200:
            return r.json()["token"]
        print(f"登录失败: {r.status_code} {r.text}")
    except Exception as e:
        print(f"连接失败: {e}")
    return None

def test_stats_api(token, role):
    print(f"\n=== 测试 {role} 的统计接口 ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试新的 /stats 接口
    r = requests.get(f"{BASE_URL}/recommendations/stats", headers=headers, timeout=5)
    if r.status_code == 200:
        d = r.json()
        print(f"✅ /recommendations/stats 正常")
        print(f"   总推荐数: {d.get('total')}")
        print(f"   待审核: {d.get('pending')}")
        print(f"   面试中: {d.get('interviewing')}")
        print(f"   已成功: {d.get('completed')}")
        print(f"   累计佣金: ¥{d.get('total_commission',0):,}")
        print(f"   已发佣金: ¥{d.get('paid_commission',0):,}")
        print(f"   待发佣金: ¥{d.get('pending_commission',0):,}")
    else:
        print(f"❌ /recommendations/stats 失败: {r.status_code} {r.text}")
    
    # 测试列表接口，确认统计口径一致
    r = requests.get(f"{BASE_URL}/recommendations", headers=headers, params={"page": 1, "pageSize": 10}, timeout=5)
    if r.status_code == 200:
        d = r.json()
        print(f"✅ /recommendations 列表正常")
        print(f"   列表总数: {d.get('total')}")
        if d.get('list'):
            rec = d['list'][0]
            print(f"   推荐记录包含新字段:")
            if 'referrer_hit_rate' in rec:
                print(f"     ✅ referrer_hit_rate: {rec['referrer_hit_rate']}%")
            if 'referrer_exposure_weight' in rec:
                print(f"     ✅ referrer_exposure_weight: {rec['referrer_exposure_weight']}")
            if 'referrer_credit' in rec:
                print(f"     ✅ referrer_credit: {rec['referrer_credit']}")
            if 'commission_tiers' in rec:
                print(f"     ✅ commission_tiers: 存在")
    else:
        print(f"❌ /recommendations 失败: {r.status_code} {r.text}")

def test_credibility_api(token):
    print(f"\n=== 测试管理员可信度复查接口 ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 获取用户列表
    r = requests.get(f"{BASE_URL}/admin/users", headers=headers, params={"page": 1, "pageSize": 5}, timeout=5)
    if r.status_code == 200:
        users = r.json().get("list", [])
        if users:
            user_id = users[0]["id"]
            print(f"测试用户: {users[0]['real_name']} (ID={user_id})")
            
            # 测试可信度详情接口
            r = requests.get(f"{BASE_URL}/admin/users/{user_id}/credibility", headers=headers, timeout=5)
            if r.status_code == 200:
                d = r.json()
                print(f"✅ /admin/users/{user_id}/credibility 正常")
                print(f"   当前信用分: {d.get('current_credit_score')}")
                print(f"   当前曝光权重: {d.get('current_exposure_weight')}")
                print(f"   历史记录: {len(d.get('history', []))} 条")
            else:
                print(f"❌ 可信度详情失败: {r.status_code} {r.text}")
    else:
        print(f"❌ 获取用户列表失败: {r.status_code}")

def test_filter_api(token):
    print(f"\n=== 测试高级筛选功能 ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试按信用分筛选
    r = requests.get(f"{BASE_URL}/recommendations", headers=headers, params={
        "page": 1, "pageSize": 10,
        "min_credit": 60, "max_credit": 100
    }, timeout=5)
    if r.status_code == 200:
        d = r.json()
        print(f"✅ 按信用分筛选 (60-100) 正常")
        print(f"   筛选后总数: {d.get('total')}")
    else:
        print(f"❌ 信用分筛选失败: {r.status_code} {r.text}")

def main():
    print("=" * 60)
    print("猎头平台 V2 功能验证")
    print("=" * 60)
    
    admin_token = login("admin", "admin123")
    user_token = login("headhunter1", "123456")
    company_token = login("company1", "123456")
    
    if admin_token:
        test_stats_api(admin_token, "管理员")
        test_credibility_api(admin_token)
        test_filter_api(admin_token)
    
    if user_token:
        test_stats_api(user_token, "猎头用户")
    
    if company_token:
        test_stats_api(company_token, "企业用户")
    
    print("\n" + "=" * 60)
    print("验证完成！请在浏览器 http://127.0.0.1:50069 进行完整验收")
    print("=" * 60)

if __name__ == "__main__":
    main()
