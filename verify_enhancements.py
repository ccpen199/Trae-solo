#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://127.0.0.1:60069/api"

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["token"]

def test_admin_dashboard(token):
    print("\n=== 1. Admin Dashboard API (管理后台) ===")
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers)
    assert r.status_code == 200, f"Failed: {r.text}"
    data = r.json()
    
    checks = [
        ("stats", data.get("stats")),
        ("hit_rate_analysis (命中率分析)", data.get("hit_rate_analysis")),
        ("exposure_analysis (曝光权重分析)", data.get("exposure_analysis")),
        ("funding_supervision (资金监管看板)", data.get("funding_supervision")),
        ("blockchain_stats (区块链存证统计)", data.get("blockchain_stats")),
        ("recent_transactions (最近交易流水)", data.get("recent_transactions")),
    ]
    
    for name, val in checks:
        status = "✅" if val else "⚠️ "
        detail = ""
        if isinstance(val, list):
            detail = f"({len(val)} records)"
        elif isinstance(val, dict):
            detail = f"({len(val)} keys)"
        print(f"  {status} {name} {detail}")
    
    if data.get("funding_supervision"):
        fs = data["funding_supervision"]
        print(f"     佣金总额: ¥{fs.get('total_commission_amount',0):,}")
        print(f"     已发放: ¥{fs.get('paid_commission_amount',0):,}")
        print(f"     待发放: ¥{fs.get('pending_commission_amount',0):,}")
    
    if data.get("hit_rate_analysis"):
        print(f"     Top 推荐人: {len(data['hit_rate_analysis'])} 人")

def test_recommendation_detail(token):
    print("\n=== 2. Recommendation Detail API (推荐详情) ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    r = requests.get(f"{BASE_URL}/recommendations", headers=headers, params={"page": 1, "pageSize": 5})
    assert r.status_code == 200
    recs = r.json().get("list", [])
    if not recs:
        print("  ⚠️  没有推荐记录")
        return
    
    rec_id = recs[0]["id"]
    print(f"  测试推荐ID: {rec_id}")
    
    r = requests.get(f"{BASE_URL}/recommendations/{rec_id}", headers=headers)
    assert r.status_code == 200
    data = r.json()
    
    checks = [
        ("基本信息 (candidate_name)", data.get("candidate_name")),
        ("commission_plans (分期佣金计划)", data.get("commission_plans")),
        ("interviews (面试记录)", data.get("interviews")),
        ("probation_feedbacks (试用期反馈)", data.get("probation_feedbacks")),
        ("blockchain_record (推荐合约存证)", data.get("blockchain_record")),
        ("commission_blockchain (分佣支付存证)", data.get("commission_blockchain")),
        ("audit_logs (操作日志)", data.get("audit_logs")),
        ("transactions (交易流水)", data.get("transactions")),
        ("referrer_stats (推荐人命中率)", data.get("referrer_stats")),
        ("offer_info (Offer信息)", data.get("offer_info")),
        ("review_feedback (审核意见)", data.get("review_feedback")),
    ]
    
    for name, val in checks:
        status = "✅" if val else "⚠️ "
        detail = ""
        if isinstance(val, list):
            detail = f"({len(val)} records)"
        elif isinstance(val, dict):
            detail = f"(present)"
        elif val:
            detail = f"({str(val)[:30]})"
        print(f"  {status} {name} {detail}")

def test_dashboard_api(token):
    print("\n=== 3. Dashboard API (首页) ===")
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/recommendations", headers=headers, params={"page": 1, "pageSize": 10})
    assert r.status_code == 200
    data = r.json()
    print(f"  ✅ 推荐列表: {len(data.get('list', []))} 条")
    
    if data.get("list"):
        rec = data["list"][0]
        print(f"     可操作字段: status={rec.get('status')}, id={rec.get('id')}")
        print(f"     候选人: {rec.get('candidate_name')}")
        print(f"     目标职位: {rec.get('job_title')}")

def test_toolbox_api(token):
    print("\n=== 4. Toolbox API (猎头工具箱) ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    test_data = {
        "candidate_name": "张三",
        "skills": ["React", "TypeScript", "Node.js"],
        "current_position": "高级前端工程师",
        "work_years": 5,
        "education": "本科"
    }
    
    r = requests.post(f"{BASE_URL}/toolbox/portrait-generate", json=test_data, headers=headers)
    if r.status_code == 200:
        data = r.json()
        print(f"  ✅ 人才画像生成: overall_score={data.get('overall_score')}")
    else:
        print(f"  ⚠️  人才画像: {r.status_code}")
    
    r = requests.get(f"{BASE_URL}/toolbox/salary-band", headers=headers, params={
        "city": "北京",
        "position": "前端工程师",
        "position_level": "高级工程师"
    })
    if r.status_code == 200:
        data = r.json()
        print(f"  ✅ 薪酬带宽查询: P50=¥{data.get('p50',0):,}")
    else:
        print(f"  ⚠️  薪酬带宽: {r.status_code}")

def test_im_api(token):
    print("\n=== 5. IM API (消息中心) ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    r = requests.get(f"{BASE_URL}/im/conversations", headers=headers)
    if r.status_code == 200:
        convs = r.json() or []
        print(f"  ✅ 会话列表: {len(convs)} 个")
    else:
        print(f"  ⚠️  会话列表: {r.status_code}")
    
    r = requests.get(f"{BASE_URL}/resumes/mine", headers=headers)
    if r.status_code == 200:
        resumes = r.json() or []
        print(f"  ✅ 简历列表: {len(resumes)} 份")
    else:
        print(f"  ⚠️  简历列表: {r.status_code}")

def main():
    print("=" * 60)
    print("猎头平台增强功能验证")
    print("=" * 60)
    
    print(f"\n后端服务: http://127.0.0.1:60069")
    print(f"前端服务: http://127.0.0.1:50069")
    
    admin_token = login("admin", "admin123")
    user_token = login("headhunter1", "123456")
    
    test_admin_dashboard(admin_token)
    test_recommendation_detail(user_token)
    test_dashboard_api(user_token)
    test_toolbox_api(user_token)
    test_im_api(user_token)
    
    print("\n" + "=" * 60)
    print("验证完成！请在浏览器打开 http://127.0.0.1:50069 进行完整验收")
    print("测试账号:")
    print("  猎头: headhunter1 / 123456")
    print("  企业: company1 / 123456")
    print("  管理员: admin / admin123")
    print("=" * 60)

if __name__ == "__main__":
    main()
