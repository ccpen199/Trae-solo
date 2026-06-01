#!/usr/bin/env python3
"""创建完整的示例数据，验证业务闭环"""
import json
import urllib.request
import urllib.error

BACKEND_URL = "http://127.0.0.1:55476"

def api(method, path, data=None):
    url = f"{BACKEND_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if method == "OPTIONS":
        req = urllib.request.Request(url, method="OPTIONS", headers=headers)
    else:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        raise

def main():
    print("=" * 60)
    print("创建完整业务闭环示例数据")
    print("=" * 60)
    print()

    # 1. 创建白板
    print("1. 创建白板...")
    board = api("POST", "/api/boards", {
        "title": "产品创新头脑风暴（完整示例）",
        "theme": "Q3 产品功能规划与用户体验提升",
        "template": "brainstorm",
        "output_goal": "确定下季度重点功能方向，输出可落地的创意点和行动项",
        "meeting_time": "2026-06-01T14:00",
        "created_by": "主持人",
        "is_anonymous": 0
    })
    board_id = board["data"]["id"]
    print(f"   ✓ 白板创建成功，ID: {board_id}")
    print(f"   标题: {board['data']['title']}")
    print(f"   模板: {board['data']['template']}")
    print()

    # 2. 添加参与人
    print("2. 添加参与人...")
    participants = ["产品经理", "设计师", "开发工程师", "运营", "测试工程师"]
    for name in participants:
        api("POST", f"/api/boards/{board_id}/participants", {
            "display_name": name,
            "role": "participant"
        })
        print(f"   ✓ 已添加: {name}")
    print()

    # 3. 添加便签
    print("3. 添加便签（按角色分类）...")
    notes = [
        # 产品经理的创意
        {"content": "优化首页加载速度，提升用户体验", "color": "#fff9c4", "note_type": "idea", "x": 80, "y": 80, "created_by": "产品经理"},
        {"content": "增加 AI 智能推荐功能，提高用户停留时间", "color": "#fff9c4", "note_type": "idea", "x": 300, "y": 80, "created_by": "产品经理"},
        {"content": "支持深色模式切换，符合用户偏好", "color": "#fff9c4", "note_type": "idea", "x": 520, "y": 80, "created_by": "产品经理"},
        # 设计师的创意
        {"content": "简化注册流程，减少用户流失", "color": "#ffecb3", "note_type": "idea", "x": 740, "y": 80, "created_by": "设计师"},
        {"content": "优化表单交互体验，提升填写效率", "color": "#ffecb3", "note_type": "idea", "x": 80, "y": 220, "created_by": "设计师"},
        {"content": "统一设计语言，增强品牌识别", "color": "#ffecb3", "note_type": "idea", "x": 300, "y": 220, "created_by": "设计师"},
        # 开发工程师的创意
        {"content": "移动端适配问题较多，需要专项优化", "color": "#dcedc8", "note_type": "problem", "x": 520, "y": 220, "created_by": "开发工程师"},
        {"content": "升级技术栈，提升开发效率", "color": "#dcedc8", "note_type": "idea", "x": 740, "y": 220, "created_by": "开发工程师"},
        {"content": "增加自动化测试覆盖率", "color": "#dcedc8", "note_type": "need", "x": 80, "y": 360, "created_by": "开发工程师"},
        # 运营的创意
        {"content": "用户反馈搜索功能不好用，需要优化", "color": "#f8bbd9", "note_type": "problem", "x": 300, "y": 360, "created_by": "运营"},
        {"content": "缺少数据导出功能，影响运营分析", "color": "#b3e5fc", "note_type": "need", "x": 520, "y": 360, "created_by": "运营"},
        {"content": "开发专属小程序版本，拓展用户触达", "color": "#fff9c4", "note_type": "opportunity", "x": 740, "y": 360, "created_by": "运营"},
        # 测试工程师的创意
        {"content": "接入第三方登录（微信/企业微信）", "color": "#dcedc8", "note_type": "need", "x": 80, "y": 500, "created_by": "测试工程师"},
        {"content": "性能监控和告警机制需要完善", "color": "#ffecb3", "note_type": "problem", "x": 300, "y": 500, "created_by": "测试工程师"},
        {"content": "支持多语言国际化", "color": "#ffecb3", "note_type": "opportunity", "x": 520, "y": 500, "created_by": "测试工程师"},
    ]
    
    note_ids = []
    for n in notes:
        r = api("POST", f"/api/boards/{board_id}/notes", n)
        note_ids.append(r["data"]["id"])
        print(f"   ✓ {n['created_by']}: {n['content'][:25]}...")
    print(f"   共创建 {len(note_ids)} 条便签")
    print()

    # 4. 对便签投票
    print("4. 对便签投票（模拟团队投票）...")
    voters = ["产品经理", "设计师", "开发工程师", "运营", "测试工程师"]
    for i, nid in enumerate(note_ids):
        # 前8条便签获得更多投票
        vote_count = max(1, 6 - (i // 2))
        for j in range(vote_count):
            api("POST", f"/api/boards/{board_id}/notes/{nid}/vote", {
                "user_id": f"voter_{nid}_{j}"
            })
        print(f"   ✓ 便签 #{nid} 获得 {vote_count} 票")
    print()

    # 5. 添加分组
    print("5. 添加分组...")
    groups = [
        {"title": "功能优化", "color": "#e3f2fd", "x": 50, "y": 50, "width": 250, "height": 180, "created_by": "主持人"},
        {"title": "用户体验", "color": "#fce4ec", "x": 310, "y": 50, "width": 250, "height": 180, "created_by": "主持人"},
        {"title": "技术提升", "color": "#e8f5e9", "x": 570, "y": 50, "width": 250, "height": 180, "created_by": "主持人"},
        {"title": "问题收集", "color": "#fff3e0", "x": 50, "y": 240, "width": 250, "height": 180, "created_by": "主持人"},
        {"title": "新机会", "color": "#f3e5f5", "x": 310, "y": 240, "width": 250, "height": 180, "created_by": "主持人"},
        {"title": "需求收集", "color": "#e0f7fa", "x": 570, "y": 240, "width": 250, "height": 180, "created_by": "主持人"},
    ]
    for g in groups:
        api("POST", f"/api/boards/{board_id}/groups", g)
        print(f"   ✓ 已添加: {g['title']}")
    print()

    # 6. 添加行动项
    print("6. 添加行动项...")
    actions = [
        {"title": "完成首页性能优化，目标加载时间 < 2s", "assignee": "开发工程师", "status": "in_progress", "priority": "high", "due_date": "2026-06-15"},
        {"title": "输出 AI 智能推荐功能需求文档", "assignee": "产品经理", "status": "pending", "priority": "high", "due_date": "2026-06-10"},
        {"title": "完成深色模式设计稿并评审", "assignee": "设计师", "status": "completed", "priority": "medium", "due_date": "2026-06-05"},
        {"title": "用户调研搜索体验，输出优化方案", "assignee": "运营", "status": "pending", "priority": "medium", "due_date": "2026-06-20"},
        {"title": "移动端适配专项优化方案", "assignee": "开发工程师", "status": "in_progress", "priority": "high", "due_date": "2026-06-25"},
        {"title": "技术栈升级方案评审", "assignee": "开发工程师", "status": "pending", "priority": "medium", "due_date": "2026-06-30"},
        {"title": "自动化测试覆盖率提升到 80%", "assignee": "测试工程师", "status": "pending", "priority": "medium", "due_date": "2026-07-05"},
        {"title": "小程序版本立项和可行性分析", "assignee": "产品经理", "status": "pending", "priority": "low", "due_date": "2026-07-10"},
    ]
    for a in actions:
        api("POST", f"/api/boards/{board_id}/actions", {
            **a,
            "item_type": "action",
            "created_by": "主持人"
        })
        status_map = {"pending": "待处理", "in_progress": "进行中", "completed": "已完成"}
        print(f"   ✓ [{status_map[a['status']]}] {a['title'][:30]}... (负责人: {a['assignee']})")
    print()

    # 7. 更新白板状态为"投票筛选"
    print("7. 更新白板状态为'投票筛选'...")
    api("PUT", f"/api/boards/{board_id}", {
        "status": "vote",
        "updated_by": "主持人"
    })
    print("   ✓ 状态已更新")
    print()

    # 8. 验证数据完整性
    print("8. 验证数据完整性...")
    stats = api("GET", f"/api/boards/{board_id}/stats")
    print(f"   ✓ 参与人数: {stats['data']['participant_count']}")
    print(f"   ✓ 便签总数: {stats['data']['total_notes']}")
    print(f"   ✓ 总投票数: {stats['data']['total_votes']}")
    print(f"   ✓ 行动项数: {stats['data']['action_count']}")
    print(f"   ✓ 已完成行动项: {stats['data']['completed_actions']}")
    print()

    review = api("GET", f"/api/boards/{board_id}/review")
    data = review["data"]
    print("9. 复盘数据验证...")
    print(f"   ✓ 参与度统计: {len(data['participation'])} 人贡献了便签")
    for name, count in data["participation"].items():
        print(f"     - {name}: {count} 个便签")
    print(f"   ✓ 热门便签 Top 3:")
    sorted_notes = sorted(data["notes"], key=lambda x: x.get("votes_count", 0), reverse=True)[:3]
    for i, n in enumerate(sorted_notes):
        print(f"     {i+1}. {n['content'][:30]}... (👍 {n.get('votes_count', 0)})")
    print()

    history = api("GET", f"/api/boards/{board_id}/history")
    print(f"10. 操作历史验证...")
    print(f"   ✓ 共记录 {len(history['data'])} 条操作")
    print(f"   最近 5 条:")
    for h in history["data"][:5]:
        print(f"     - {h['operation']} by {h['created_by']}")
    print()

    print("=" * 60)
    print("✅ 完整业务闭环示例数据创建成功！")
    print("=" * 60)
    print()
    print(f"访问地址:")
    print(f"  前台: http://127.0.0.1:45476/?board={board_id}")
    print(f"  管理后台: http://127.0.0.1:45476/admin.html")
    print(f"  后端 API: http://127.0.0.1:55476/")
    print()
    print("业务闭环验证路径:")
    print(f"  1. 创建白板 → 2. 添加参与人 → 3. 头脑风暴（便签）")
    print(f"  4. 投票筛选 → 5. 分组整理 → 6. 产出行动项 → 7. 复盘分析")
    print()

if __name__ == "__main__":
    main()
