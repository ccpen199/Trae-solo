#!/usr/bin/env python3
"""
第四轮验收测试 - 专项验证用户反馈问题
"""

import requests
import json

BASE_URL = "http://127.0.0.1:59220"

def log(test_name, passed, detail=""):
    status = "✅" if passed else "❌"
    print(f"{status} {test_name} {'- ' + detail if detail else ''}")
    return bool(passed)

def main():
    print("=" * 70)
    print("  第四轮专项验收测试 - 用户反馈问题验证")
    print("=" * 70)
    
    results = []
    
    print("\n📰 【首页业务状态验证】")
    print("-" * 70)
    
    # 1. 测试公告severity分级
    try:
        res = requests.get(f"{BASE_URL}/api/utilities/updates", params={"severity": 2})
        data = res.json()
        updates = data.get("updates", [])
        has_severity = all("severity" in u for u in updates)
        results.append(log("公告有severity风险等级字段", has_severity and len(updates) > 0,
            f"{len(updates)}条公告，最高severity={max([u.get('severity', 0) for u in updates] or [0])}"))
    except Exception as e:
        results.append(log("公告有severity风险等级字段", False, str(e)))
        updates = []
    
    # 2. 测试公告有locationScope推送范围
    try:
        has_scope = any(u.get("locationScope") for u in updates)
        results.append(log("公告有推送范围字段", has_scope,
            f"{sum(1 for u in updates if u.get('locationScope'))}/{len(updates)}条有范围"))
    except Exception as e:
        results.append(log("公告有推送范围字段", False, str(e)))
    
    # 3. 测试公告有startTime/endTime到期状态
    try:
        has_times = any(u.get("startTime") or u.get("endTime") for u in updates)
        results.append(log("公告有开始/结束时间", has_times,
            f"{sum(1 for u in updates if u.get('startTime') or u.get('endTime'))}/{len(updates)}条有时间"))
    except Exception as e:
        results.append(log("公告有开始/结束时间", False, str(e)))
    
    print("\n📝 【首页快速发布入口验证】")
    print("-" * 70)
    
    # 4. 测试feed支持的内容类型
    try:
        types_needed = ["NOTICE", "NEWS", "REVIEW", "ACTIVITY", "INFO", "EMERGENCY"]
        type_counts = {}
        for t in types_needed:
            res = requests.get(f"{BASE_URL}/api/posts/feed", params={
                "latitude": 39.9939, "longitude": 116.4778, "type": t, "limit": 3
            })
            type_counts[t] = len(res.json().get("posts", []))
        has_all_types = all(c > 0 for c in type_counts.values())
        results.append(log("6种内容类型全部可发布/展示", has_all_types,
            f"各类型数量: {json.dumps(type_counts, ensure_ascii=False)}"))
    except Exception as e:
        results.append(log("6种内容类型全部可发布/展示", False, str(e)))
    
    # 5. 测试Post详情有auditLogs
    try:
        res = requests.get(f"{BASE_URL}/api/posts/feed", params={
            "latitude": 39.9939, "longitude": 116.4778, "limit": 10
        })
        posts = res.json().get("posts", [])
        post_with_audit = next((p for p in posts if p.get("auditLogs")), None)
        if post_with_audit:
            post_id = post_with_audit["id"]
            detail_res = requests.get(f"{BASE_URL}/api/posts/{post_id}")
            detail_audit = len(detail_res.json().get("post", {}).get("auditLogs", []))
            results.append(log("Post详情有审核日志链路", detail_audit > 0,
                f"{detail_audit}条审核记录"))
        else:
            results.append(log("Post详情有审核日志链路", False, "Feed无auditLogs"))
    except Exception as e:
        results.append(log("Post详情有审核日志链路", False, str(e)))
    
    print("\n🛠️ 【便民主线服务链路验证】")
    print("-" * 70)
    
    # 6. 测试公交站API
    try:
        res = requests.get(f"{BASE_URL}/api/utilities/bus/stations", params={
            "latitude": 39.9939, "longitude": 116.4778
        })
        data = res.json()
        stations = data.get("stations", [])
        has_predictions = any("predictions" in s and s["predictions"] for s in stations)
        results.append(log("公交站到站预测可用", len(stations) > 0 and has_predictions,
            f"{len(stations)}个公交站"))
    except Exception as e:
        results.append(log("公交站到站预测可用", False, str(e)))
    
    # 7. 测试核酸点API
    try:
        res = requests.get(f"{BASE_URL}/api/utilities/test-sites", params={
            "latitude": 39.9939, "longitude": 116.4778
        })
        data = res.json()
        sites = data.get("sites", [])
        has_status = any("status" in s and "price" in s and "waitTime" in s for s in sites)
        results.append(log("核酸点实时状态可用", len(sites) > 0 and has_status,
            f"{len(sites)}个检测点"))
    except Exception as e:
        results.append(log("核酸点实时状态可用", False, str(e)))
    
    # 8. 测试便民服务订阅API
    try:
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "13900000000", "password": "123456"
        })
        token = login_res.json().get("token")
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            sub_res = requests.post(f"{BASE_URL}/api/utilities/subscribe",
                headers=headers, json={"type": "EMERGENCY"})
            results.append(log("便民服务订阅可用", sub_res.status_code in [200, 201],
                f"状态码: {sub_res.status_code}"))
        else:
            results.append(log("便民服务订阅可用", False, "登录失败"))
    except Exception as e:
        results.append(log("便民服务订阅可用", False, str(e)))
    
    # 9. 测试我的订阅列表API
    try:
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            res = requests.get(f"{BASE_URL}/api/utilities/subscriptions", headers=headers)
            data = res.json()
            subs = data.get("subscriptions", [])
            results.append(log("我的订阅列表可用", isinstance(subs, list),
                f"{len(subs)}条订阅"))
        else:
            results.append(log("我的订阅列表可用", False, "无token"))
    except Exception as e:
        results.append(log("我的订阅列表可用", False, str(e)))
    
    print("\n🔧 【后台管理可见入口验证】")
    print("-" * 70)
    
    # 10. 测试管理员审核待办
    try:
        admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "13800000000", "password": "123456"
        })
        admin_token = admin_login.json().get("token")
        admin_role = admin_login.json().get("user", {}).get("role")
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            pending_res = requests.get(f"{BASE_URL}/api/admin/audit/pending", headers=headers)
            pending_count = len(pending_res.json().get("posts", []))
            results.append(log("内容安全复审可用", pending_count > 0,
                f"待审核: {pending_count}条，角色: {admin_role}"))
        else:
            results.append(log("内容安全复审可用", False, "管理员登录失败"))
    except Exception as e:
        results.append(log("内容安全复审可用", False, str(e)))
    
    # 11. 测试治理驾驶舱
    try:
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            dash_res = requests.get(f"{BASE_URL}/api/admin/dashboard/overview", headers=headers)
            stats = dash_res.json().get("stats", {})
            hotspots = requests.get(f"{BASE_URL}/api/admin/dashboard/hotspots", headers=headers)
            clusters = len(hotspots.json().get("topicClusters", []))
            results.append(log("治理驾驶舱预警可用", "postCount" in stats and clusters > 0,
                f"帖子数: {stats.get('postCount', 0)}，热点聚类: {clusters}"))
        else:
            results.append(log("治理驾驶舱预警可用", False, "无token"))
    except Exception as e:
        results.append(log("治理驾驶舱预警可用", False, str(e)))
    
    # 12. 测试商户核销转化效能
    try:
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            res = requests.get(f"{BASE_URL}/api/admin/merchant-efficiency", headers=headers)
            merchants = res.json().get("merchants", [])
            has_stats = any("stats" in m for m in merchants)
            results.append(log("商户核销转化效能可用", len(merchants) > 0,
                f"{len(merchants)}家商户数据"))
        else:
            results.append(log("商户核销转化效能可用", False, "无token"))
    except Exception as e:
        results.append(log("商户核销转化效能可用", False, str(e)))
    
    print("\n👤 【市民画像兴趣图谱验证】")
    print("-" * 70)
    
    # 13. 测试User返回interestTags
    try:
        user_data = login_res.json().get("user", {})
        has_tags = "interestTags" in user_data
        results.append(log("User返回兴趣标签", has_tags,
            f"{len(user_data.get('interestTags', []))}个标签"))
    except Exception as e:
        results.append(log("User返回兴趣标签", False, str(e)))
    
    # 14. 测试User返回订阅偏好/互助能力
    try:
        user_data = login_res.json().get("user", {})
        has_basic = all(k in user_data for k in ["latitude", "longitude", "isVerified", "creditScore"])
        results.append(log("User返回基础画像字段", has_basic,
            f"位置: {bool(user_data.get('latitude'))}, 认证: {user_data.get('isVerified')}, 信用: {user_data.get('creditScore')}"))
    except Exception as e:
        results.append(log("User返回基础画像字段", False, str(e)))
    
    print("\n" + "=" * 70)
    print("  第四轮验收汇总")
    print("=" * 70)
    
    passed_count = sum(1 for r in results if r)
    total = len(results)
    print(f"\n通过: {passed_count}/{total} ({round(passed_count/total*100)}%)")
    
    if passed_count == total:
        print("\n🎉 第四轮专项验收全部通过！用户反馈问题已全部修复！")
    else:
        print(f"\n⚠️  有 {total - passed_count} 项未通过，需要继续修复")
    
    return passed_count == total

if __name__ == "__main__":
    main()
