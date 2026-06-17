#!/usr/bin/env python3
"""
第七轮验收测试 - 专项验证用户反馈问题
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
    print("  第七轮专项验收测试 - 用户反馈问题验证")
    print("=" * 70)
    
    results = []
    
    print("\n🚪 【首页入口跳转闭环验证】")
    print("-" * 70)
    
    # 1. 测试首页Feed数据
    try:
        res = requests.get(f"{BASE_URL}/api/posts/feed", params={
            "latitude": 39.9939, "longitude": 116.4778, "limit": 5
        })
        posts = res.json().get("posts", [])
        results.append(log("首页Feed数据可用", len(posts) > 0, f"{len(posts)}条"))
    except Exception as e:
        results.append(log("首页Feed数据可用", False, str(e)))
    
    # 2. 测试公告数据
    try:
        res = requests.get(f"{BASE_URL}/api/utilities/updates", params={"severity": 1, "limit": 5})
        updates = res.json().get("updates", [])
        results.append(log("首页公告数据可用", len(updates) > 0, f"{len(updates)}条"))
    except Exception as e:
        results.append(log("首页公告数据可用", False, str(e)))
    
    # 3. 测试话题数据
    try:
        res = requests.get(f"{BASE_URL}/api/topics/hot")
        topics = res.json().get("topics", [])
        results.append(log("首页话题数据可用", len(topics) > 0, f"{len(topics)}个"))
    except Exception as e:
        results.append(log("首页话题数据可用", False, str(e)))
    
    print("\n📝 【发布表单按类型切换验证】")
    print("-" * 70)
    
    # 4. 测试发布API可用
    try:
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "13900000000", "password": "123456"
        })
        token = login_res.json().get("token")
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            
            # 测试发布探店笔记
            post_res = requests.post(f"{BASE_URL}/api/posts", headers=headers, json={
                "type": "REVIEW",
                "title": "测试探店-第七轮",
                "content": "测试探店笔记内容",
                "latitude": 39.9939,
                "longitude": 116.4778,
                "locationName": "北京望京",
                "priceAnchor": 85,
                "hasProof": True,
                "isPitfall": False,
            })
            review_ok = post_res.status_code == 200 and 'post' in post_res.json()
            results.append(log("探店笔记发布成功", review_ok, f"状态码: {post_res.status_code}"))
            
            # 测试发布政务通知
            notice_res = requests.post(f"{BASE_URL}/api/posts", headers=headers, json={
                "type": "NOTICE",
                "title": "测试通知-第七轮",
                "content": "测试政务通知内容",
                "latitude": 39.9939,
                "longitude": 116.4778,
                "locationName": "北京望京",
                "sourceOrg": "望京街道办",
            })
            notice_ok = notice_res.status_code == 200 and 'post' in notice_res.json()
            results.append(log("政务通知发布成功", notice_ok, f"状态码: {notice_res.status_code}"))
            
            # 测试发布突发事件
            emergency_res = requests.post(f"{BASE_URL}/api/posts", headers=headers, json={
                "type": "EMERGENCY",
                "title": "测试突发-第七轮",
                "content": "测试突发事件内容",
                "latitude": 39.9939,
                "longitude": 116.4778,
                "locationName": "北京望京",
            })
            emergency_ok = emergency_res.status_code == 200 and 'post' in emergency_res.json()
            results.append(log("突发事件发布成功", emergency_ok, f"状态码: {emergency_res.status_code}"))
        else:
            results.append(log("发布API可用", False, "登录失败"))
            results.append(log("政务通知发布成功", False, "登录失败"))
            results.append(log("突发事件发布成功", False, "登录失败"))
    except Exception as e:
        results.append(log("发布API可用", False, str(e)))
    
    print("\n🔍 【资讯流审核闭环验证】")
    print("-" * 70)
    
    # 5. 测试帖子含审核日志
    try:
        res = requests.get(f"{BASE_URL}/api/posts/feed", params={
            "latitude": 39.9939, "longitude": 116.4778, "limit": 10
        })
        posts = res.json().get("posts", [])
        has_audit = any("auditLogs" in p and len(p["auditLogs"]) > 0 for p in posts)
        audit_count = sum(1 for p in posts if p.get("auditLogs"))
        results.append(log("资讯流含审核日志", has_audit, f"{audit_count}/{len(posts)}篇"))
    except Exception as e:
        results.append(log("资讯流含审核日志", False, str(e)))
    
    # 6. 测试审核待审核列表
    try:
        admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "13800000000", "password": "123456"
        })
        admin_token = admin_login.json().get("token")
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            pending_res = requests.get(f"{BASE_URL}/api/admin/audit/pending", headers=headers)
            pending = pending_res.json().get("posts", [])
            has_risk = any("aiRiskLevel" in p for p in pending)
            results.append(log("审核待办含风险等级", len(pending) > 0 and has_risk, f"待审核: {len(pending)}条"))
        else:
            results.append(log("审核待办含风险等级", False, "管理员登录失败"))
    except Exception as e:
        results.append(log("审核待办含风险等级", False, str(e)))
    
    # 7. 测试溯源接口
    try:
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            res = requests.get(f"{BASE_URL}/api/posts/feed", params={
                "latitude": 39.9939, "longitude": 116.4778, "limit": 1
            })
            post_id = res.json().get("posts", [{}])[0].get("id")
            if post_id:
                trace_res = requests.get(f"{BASE_URL}/api/admin/audit/trace/{post_id}", headers=headers)
                trace_ok = trace_res.status_code == 200 and 'logs' in trace_res.json()
                results.append(log("谣言溯源可追溯", trace_ok, f"状态码: {trace_res.status_code}, 日志: {len(trace_res.json().get('logs', []))}条"))
            else:
                results.append(log("谣言溯源可追溯", False, "无帖子"))
        else:
            results.append(log("谣言溯源可追溯", False, "无admin token"))
    except Exception as e:
        results.append(log("谣言溯源可追溯", False, str(e)))
    
    # 8. 测试审核通过/拒绝
    try:
        if admin_token and len(pending) > 0:
            headers = {"Authorization": f"Bearer {admin_token}"}
            post_id = pending[0].get("id")
            if post_id:
                approve_res = requests.post(f"{BASE_URL}/api/admin/audit/{post_id}/approve", headers=headers, json={"reason": "测试通过"})
                results.append(log("审核通过操作可用", approve_res.status_code == 200, f"状态码: {approve_res.status_code}"))
            else:
                results.append(log("审核通过操作可用", False, "无待审核帖子"))
        else:
            results.append(log("审核通过操作可用", False, "无待审核数据"))
    except Exception as e:
        results.append(log("审核通过操作可用", False, str(e)))
    
    print("\n👤 【个人资料可复验链路验证】")
    print("-" * 70)
    
    # 9. 测试用户角色权限
    try:
        user = login_res.json().get("user", {})
        has_role = "role" in user
        has_verified = "isVerified" in user
        has_credit = "creditScore" in user
        results.append(log("用户含角色权限信息", has_role and has_verified and has_credit,
            f"角色: {user.get('role')}, 认证: {user.get('isVerified')}, 信用: {user.get('creditScore')}"))
    except Exception as e:
        results.append(log("用户含角色权限信息", False, str(e)))
    
    # 10. 测试用户兴趣标签
    try:
        user = login_res.json().get("user", {})
        tags = user.get("interestTags", [])
        has_location = user.get("latitude") is not None
        results.append(log("用户含兴趣+位置画像", len(tags) > 0 and has_location,
            f"标签: {len(tags)}个, 位置: {bool(user.get('latitude'))}"))
    except Exception as e:
        results.append(log("用户含兴趣+位置画像", False, str(e)))
    
    # 11. 测试订阅完整链路
    try:
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            
            # 订阅
            sub_res = requests.post(f"{BASE_URL}/api/utilities/subscribe", headers=headers,
                json={"type": "POWER_NOTICE"})
            sub_ok = sub_res.status_code == 200
            
            # 查询订阅列表
            list_res = requests.get(f"{BASE_URL}/api/utilities/subscriptions", headers=headers)
            subs = list_res.json().get("subscriptions", [])
            
            # 取消订阅
            unsub_ok = True
            if subs:
                unsub_res = requests.delete(f"{BASE_URL}/api/utilities/subscriptions/{subs[0]['id']}", headers=headers)
                unsub_ok = unsub_res.status_code in [200, 204]
            
            results.append(log("订阅-取消完整链路", sub_ok and len(subs) > 0 and unsub_ok,
                f"订阅: {'OK' if sub_ok else 'FAIL'}, 列表: {len(subs)}条, 取消: {'OK' if unsub_ok else 'FAIL'}"))
        else:
            results.append(log("订阅-取消完整链路", False, "无token"))
    except Exception as e:
        results.append(log("订阅-取消完整链路", False, str(e)))
    
    print("\n🏪 【商户核销转化验证】")
    print("-" * 70)
    
    # 12. 测试商户效能列表
    try:
        if admin_token:
            headers = {"Authorization": f"Bearer {admin_token}"}
            eff_res = requests.get(f"{BASE_URL}/api/admin/merchant-efficiency", headers=headers)
            merchants = eff_res.json().get("merchants", [])
            summary = eff_res.json().get("summary", {})
            has_stats = all("stats" in m for m in merchants[:3]) if merchants else False
            results.append(log("商户核销转化效能完整", len(merchants) > 0 and has_stats,
                f"商户: {len(merchants)}家, 平均核销率: {summary.get('avgRedeemRate', 0)}%"))
        else:
            results.append(log("商户核销转化效能完整", False, "无admin token"))
    except Exception as e:
        results.append(log("商户核销转化效能完整", False, str(e)))
    
    # 13. 测试商户详情
    try:
        res = requests.get(f"{BASE_URL}/api/merchants/nearby", params={
            "latitude": 39.9939, "longitude": 116.4778, "radius": 5000
        })
        merchants = res.json().get("merchants", [])
        has_license = any(m.get("licenseVerified") for m in merchants)
        has_rating = any(m.get("rating") for m in merchants)
        results.append(log("商户列表含核验+评分", len(merchants) > 0 and has_license and has_rating,
            f"{len(merchants)}家"))
    except Exception as e:
        results.append(log("商户列表含核验+评分", False, str(e)))
    
    print("\n" + "=" * 70)
    print("  第七轮验收汇总")
    print("=" * 70)
    
    passed_count = sum(1 for r in results if r)
    total = len(results)
    print(f"\n通过: {passed_count}/{total} ({round(passed_count/total*100)}%)")
    
    if passed_count == total:
        print("\n🎉 第七轮专项验收全部通过！用户反馈问题已全部修复！")
    else:
        print(f"\n⚠️  有 {total - passed_count} 项未通过，需要继续修复")
    
    return passed_count == total

if __name__ == "__main__":
    main()
