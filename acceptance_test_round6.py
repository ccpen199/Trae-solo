#!/usr/bin/env python3
"""
第六轮验收测试 - 专项验证用户反馈问题
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
    print("  第六轮专项验收测试 - 用户反馈问题验证")
    print("=" * 70)
    
    results = []
    
    print("\n🚀 【快速发布流程闭环验证】")
    print("-" * 70)
    
    # 1. 测试CreatePost页面支持所有6种类型
    try:
        types = ["NEWS", "REVIEW", "NOTICE", "EMERGENCY", "ACTIVITY", "INFO"]
        for t in types:
            res = requests.get(f"{BASE_URL}/api/posts/feed", params={
                "latitude": 39.9939, "longitude": 116.4778, "type": t, "limit": 1
            })
            if res.status_code != 200:
                results.append(log(f"类型{t}可查询", False, f"状态码: {res.status_code}"))
                break
        else:
            results.append(log("6种内容类型全部可发布查询", True, f"类型: {', '.join(types)}"))
    except Exception as e:
        results.append(log("6种内容类型全部可发布查询", False, str(e)))
    
    # 2. 测试CreatePost表单字段
    try:
        res = requests.get(f"{BASE_URL}/api/posts/feed", params={
            "latitude": 39.9939, "longitude": 116.4778, "type": "REVIEW", "limit": 1
        })
        posts = res.json().get("posts", [])
        if posts:
            p = posts[0]
            has_fields = all(k in p for k in ["priceAnchor", "hasProof", "isPitfall", "merchant"])
            results.append(log("探店笔记含价格锚点/凭证/避坑字段", has_fields,
                f"priceAnchor={p.get('priceAnchor')}, hasProof={p.get('hasProof')}, isPitfall={p.get('isPitfall')}"))
        else:
            results.append(log("探店笔记含价格锚点/凭证/避坑字段", False, "无数据"))
    except Exception as e:
        results.append(log("探店笔记含价格锚点/凭证/避坑字段", False, str(e)))
    
    # 3. 测试发布帖子API
    try:
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "13900000000", "password": "123456"
        })
        token = login_res.json().get("token")
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            post_res = requests.post(f"{BASE_URL}/api/posts", headers=headers, json={
                "type": "NEWS",
                "title": "测试发布-第六轮验收",
                "content": "这是一条测试发布内容，验证发布流程闭环",
                "latitude": 39.9939,
                "longitude": 116.4778,
                "locationName": "北京望京",
                "sourceLevel": "ORDINARY",
                "priceAnchor": "",
                "hasProof": False,
                "isPitfall": False,
            })
            results.append(log("发布帖子API可用", post_res.status_code in [200, 201] and 'post' in post_res.json(),
                f"状态码: {post_res.status_code}, 响应: {'post' in post_res.json()}"))
        else:
            results.append(log("发布帖子API可用", False, "登录失败"))
    except Exception as e:
        results.append(log("发布帖子API可用", False, str(e)))
    
    print("\n🔥 【周边热门动态分级验证】")
    print("-" * 70)
    
    # 4. 测试Feed返回信源等级和审核日志
    try:
        res = requests.get(f"{BASE_URL}/api/posts/feed", params={
            "latitude": 39.9939, "longitude": 116.4778, "limit": 10
        })
        posts = res.json().get("posts", [])
        has_source_levels = any(p.get("sourceLevel") in ["GOV", "OFFICIAL", "V"] for p in posts)
        has_audit = any(p.get("auditLogs") and len(p["auditLogs"]) > 0 for p in posts)
        type_dist = {}
        for p in posts:
            type_dist[p.get("type", "?")] = type_dist.get(p.get("type", "?"), 0) + 1
        results.append(log("Feed返回分级信源和审核日志", has_source_levels and has_audit,
            f"类型分布: {json.dumps(type_dist, ensure_ascii=False)}"))
    except Exception as e:
        results.append(log("Feed返回分级信源和审核日志", False, str(e)))
    
    # 5. 测试话题聚合
    try:
        res = requests.get(f"{BASE_URL}/api/topics/hot")
        topics = res.json().get("topics", [])
        results.append(log("话题聚合数据可用", len(topics) > 0,
            f"{len(topics)}个话题"))
    except Exception as e:
        results.append(log("话题聚合数据可用", False, str(e)))
    
    print("\n🛠️ 【便民服务闭环验证】")
    print("-" * 70)
    
    # 6. 测试公交到站
    try:
        res = requests.get(f"{BASE_URL}/api/utilities/bus/stations", params={
            "latitude": 39.9939, "longitude": 116.4778
        })
        stations = res.json().get("stations", [])
        has_predictions = any("predictions" in s and len(s["predictions"]) > 0 for s in stations)
        results.append(log("公交到站预测闭环", len(stations) > 0 and has_predictions,
            f"{len(stations)}站，含到站预测"))
    except Exception as e:
        results.append(log("公交到站预测闭环", False, str(e)))
    
    # 7. 测试核酸检测点
    try:
        res = requests.get(f"{BASE_URL}/api/utilities/test-sites", params={
            "latitude": 39.9939, "longitude": 116.4778
        })
        sites = res.json().get("sites", [])
        has_status = any("status" in s and "price" in s and "waitTime" in s for s in sites)
        results.append(log("核酸检测点闭环", len(sites) > 0 and has_status,
            f"{len(sites)}个点，含实时状态"))
    except Exception as e:
        results.append(log("核酸检测点闭环", False, str(e)))
    
    # 8. 测试订阅完整流程
    try:
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            sub_res = requests.post(f"{BASE_URL}/api/utilities/subscribe",
                headers=headers, json={"type": "WATER_NOTICE"})
            list_res = requests.get(f"{BASE_URL}/api/utilities/subscriptions", headers=headers)
            subs = list_res.json().get("subscriptions", [])
            has_water = any(s.get("type") == "WATER_NOTICE" for s in subs)
            unsub_available = True
            if subs:
                unsub_res = requests.delete(
                    f"{BASE_URL}/api/utilities/subscriptions/{subs[0]['id']}",
                    headers=headers)
                unsub_available = unsub_res.status_code in [200, 204]
            results.append(log("订阅-取消完整闭环", has_water and unsub_available,
                f"订阅数: {len(subs)}, 取消: {'OK' if unsub_available else 'FAIL'}"))
        else:
            results.append(log("订阅-取消完整闭环", False, "无token"))
    except Exception as e:
        results.append(log("订阅-取消完整闭环", False, str(e)))
    
    print("\n🔧 【后台管理工作台验证】")
    print("-" * 70)
    
    # 9. 测试审核工作台
    try:
        admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "13800000000", "password": "123456"
        })
        admin_token = admin_login.json().get("token")
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            pending_res = requests.get(f"{BASE_URL}/api/admin/audit/pending", headers=headers)
            pending = pending_res.json().get("posts", [])
            has_risk_levels = any(p.get("aiRiskLevel") for p in pending)
            results.append(log("审核工作台含待审核+风险等级", len(pending) > 0 and has_risk_levels,
                f"待审核: {len(pending)}条"))
        else:
            results.append(log("审核工作台含待审核+风险等级", False, "管理员登录失败"))
    except Exception as e:
        results.append(log("审核工作台含待审核+风险等级", False, str(e)))
    
    # 10. 测试溯源接口
    try:
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            res = requests.get(f"{BASE_URL}/api/posts/feed", params={
                "latitude": 39.9939, "longitude": 116.4778, "limit": 1
            })
            post_id = res.json().get("posts", [{}])[0].get("id")
            if post_id:
                trace_res = requests.get(f"{BASE_URL}/api/admin/audit/trace/{post_id}", headers=headers)
                results.append(log("谣言溯源可追溯", trace_res.status_code == 200,
                    f"状态码: {trace_res.status_code}"))
            else:
                results.append(log("谣言溯源可追溯", False, "无帖子ID"))
        else:
            results.append(log("谣言溯源可追溯", False, "无admin token"))
    except Exception as e:
        results.append(log("谣言溯源可追溯", False, str(e)))
    
    # 11. 测试商户核销转化
    try:
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            eff_res = requests.get(f"{BASE_URL}/api/admin/merchant-efficiency", headers=headers)
            merchants = eff_res.json().get("merchants", [])
            summary = eff_res.json().get("summary", {})
            has_conversion = any("conversionPath" in m.get("stats", {}) for m in merchants)
            results.append(log("商户核销转化可统计", len(merchants) > 0 and has_conversion,
                f"商户: {len(merchants)}, 平均核销率: {summary.get('avgRedeemRate', 0)}%"))
        else:
            results.append(log("商户核销转化可统计", False, "无admin token"))
    except Exception as e:
        results.append(log("商户核销转化可统计", False, str(e)))
    
    # 12. 测试社区风险预警
    try:
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            hot_res = requests.get(f"{BASE_URL}/api/admin/dashboard/hotspots", headers=headers)
            clusters = hot_res.json().get("topicClusters", [])
            risks = hot_res.json().get("risks", [])
            results.append(log("社区风险预警可查看", len(clusters) > 0,
                f"热点: {len(clusters)}, 风险: {len(risks)}"))
        else:
            results.append(log("社区风险预警可查看", False, "无admin token"))
    except Exception as e:
        results.append(log("社区风险预警可查看", False, str(e)))
    
    print("\n👤 【市民画像服务分发验证】")
    print("-" * 70)
    
    # 13. 测试User返回兴趣标签和服务偏好
    try:
        user_data = login_res.json().get("user", {})
        has_tags = "interestTags" in user_data and len(user_data.get("interestTags", [])) > 0
        has_location = "latitude" in user_data and user_data.get("latitude") is not None
        results.append(log("User画像含兴趣+位置+认证", has_tags and has_location,
            f"标签: {len(user_data.get('interestTags', []))}, 位置: {bool(user_data.get('latitude'))}, 信用: {user_data.get('creditScore')}"))
    except Exception as e:
        results.append(log("User画像含兴趣+位置+认证", False, str(e)))
    
    print("\n" + "=" * 70)
    print("  第六轮验收汇总")
    print("=" * 70)
    
    passed_count = sum(1 for r in results if r)
    total = len(results)
    print(f"\n通过: {passed_count}/{total} ({round(passed_count/total*100)}%)")
    
    if passed_count == total:
        print("\n🎉 第六轮专项验收全部通过！用户反馈问题已全部修复！")
    else:
        print(f"\n⚠️  有 {total - passed_count} 项未通过，需要继续修复")
    
    return passed_count == total

if __name__ == "__main__":
    main()
