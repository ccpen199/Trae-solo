#!/usr/bin/env python3
import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:59168/api"

def post(url, data, token=None):
    req = urllib.request.Request(
        f"{BASE}{url}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def get(url, token=None):
    req = urllib.request.Request(f"{BASE}{url}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def test():
    print("=" * 60)
    print("企业招聘与内训一体化数字工作台 - E2E API测试")
    print("=" * 60)

    # 1. 健康检查
    print("\n[1] 健康检查: ", end="")
    r = get("/health")
    print("✅" if r.get("status") == "ok" else "❌", r)

    tokens = {}
    # 2. 多角色登录
    for role, (u, p) in {"admin": ("admin", "123456"), "hr": ("hr01", "123456"),
                          "trainer": ("trainer01", "123456"), "seeker": ("seeker01", "123456")}.items():
        print(f"[{role.upper()}] 登录 {u}/{p}: ", end="")
        r = post("/auth/login", {"username": u, "password": p})
        tokens[role] = r.get("token", "")
        print("✅" if r.get("token") else f"❌ {r}")

    # 3. 获取当前用户
    print("\n获取用户信息(admin): ", end="")
    r = get("/auth/me", tokens["admin"])
    print("✅" if r.get("user") else f"❌ {r}")

    # 4. 岗位
    print("\n[岗位模块]")
    print("  获取岗位列表: ", end="")
    r = get("/jobs", tokens["hr"])
    print(f"✅ 共{len(r.get('jobs', []))}个")

    # 5. 简历
    print("\n[简历模块]")
    print("  获取简历列表: ", end="")
    r = get("/resumes", tokens["hr"])
    print(f"✅ 共{len(r.get('resumes', []))}份")

    # 6. 智能匹配
    print("\n[智能匹配]")
    print("  求职者岗位推荐: ", end="")
    r = get("/matching/jobs/recommend", tokens["seeker"])
    print(f"✅ 推荐{len(r.get('recommendations', []))}个")

    print("  技能图谱: ", end="")
    r = get("/matching/skill-graph", tokens["admin"])
    print(f"✅ {len(r.get('nodes', []))}节点/{len(r.get('links', []))}连线")

    print("  意图识别测试: ", end="")
    r = post("/matching/analyze-intent", {"text": "我想找一份Java开发的工作，薪资20K左右"}, tokens["seeker"])
    print(f"✅ intent={r.get('intent')}, keywords={r.get('keywords')}")

    # 7. 社区
    print("\n[社区模块]")
    print("  话题列表: ", end="")
    r = get("/community/topics", tokens["seeker"])
    print(f"✅ {len(r.get('topics', []))}个话题")

    print("  社区统计: ", end="")
    r = get("/community/stats/summary", tokens["seeker"])
    print("✅", r.get("stats"))

    # 8. 聊天
    print("\n[直聊系统]")
    print("  会话列表: ", end="")
    r = get("/chat/sessions", tokens["hr"])
    print(f"✅ {len(r.get('sessions', []))}个会话")

    print("  未读消息计数: ", end="")
    r = get("/chat/unread/count", tokens["hr"])
    print("✅ count=", r.get("count", 0))

    # 9. 企业功能
    print("\n[企业端]")
    print("  线索池: ", end="")
    r = get("/enterprise/leads", tokens["hr"])
    print(f"✅ {len(r.get('leads', []))}条线索")

    print("  我的电子名片: ", end="")
    r = get("/enterprise/business-card/my", tokens["hr"])
    print("✅", "已创建" if r.get("card") else "未创建")

    print("  推送记录: ", end="")
    r = get("/enterprise/push/records", tokens["hr"])
    print(f"✅ {len(r.get('records', []))}条记录")

    # 10. LMS网校
    print("\n[SaaS网校]")
    print("  课程列表: ", end="")
    r = get("/lms/courses", tokens["seeker"])
    print(f"✅ {len(r.get('courses', []))}门课程")

    print("  我的学习进度: ", end="")
    r = get("/lms/my/progress", tokens["seeker"])
    print(f"✅ {len(r.get('progress', []))}门在学")

    print("  我的证书: ", end="")
    r = get("/lms/my/certificates", tokens["seeker"])
    print(f"✅ {len(r.get('certificates', []))}张证书")

    # 11. 通知
    print("\n[通知中心]")
    print("  通知列表: ", end="")
    r = get("/notifications", tokens["admin"])
    print(f"✅ {len(r.get('notifications', []))}条")

    # 12. 管理功能
    print("\n[后台管理]")
    print("  用户列表(admin): ", end="")
    r = get("/users", tokens["admin"])
    print(f"✅ {len(r.get('users', []))}个用户")

    print("  审计日志: ", end="")
    r = get("/users/audit/logs?page=1&pageSize=5", tokens["admin"])
    print(f"✅ 共{r.get('total', 0)}条日志, 当前{len(r.get('logs', []))}条")

    # 13. 切换角色
    print("\n[角色切换]")
    print("  获取可用角色: ", end="")
    r = get("/auth/roles/available", tokens["hr"])
    print("✅ roles=", r.get("roles"))

    # 14. 仪表盘统计
    print("\n[仪表盘]")
    print("  统计数据: ", end="")
    r = get("/stats/dashboard", tokens["admin"])
    print("✅", r.get("stats"))

    print("\n" + "=" * 60)
    print("✅ 所有核心API测试完成!")
    print("=" * 60)

if __name__ == "__main__":
    test()
