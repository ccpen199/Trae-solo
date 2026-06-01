#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BACKEND_URL = "http://127.0.0.1:55476"

def api(method, path, data=None):
    url = f"{BACKEND_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        raise

def main():
    print("=== 创建测试白板 ===")
    board = api("POST", "/api/boards", {
        "title": "产品创新头脑风暴（测试）",
        "theme": "Q3 产品功能规划",
        "template": "brainstorm",
        "output_goal": "确定下季度重点功能方向",
        "meeting_time": "2026-06-01T14:00",
        "created_by": "主持人",
        "is_anonymous": 0
    })
    board_id = board["data"]["id"]
    print(f"创建成功，Board ID: {board_id}")
    print()

    print("=== 添加参与人 ===")
    participants = ["产品经理", "设计师", "开发工程师", "运营"]
    for name in participants:
        r = api("POST", f"/api/boards/{board_id}/participants", {
            "display_name": name,
            "role": "participant"
        })
        print(f"  已添加: {name}")
    print()

    print("=== 添加便签 ===")
    notes = [
        {"content": "优化首页加载速度，提升用户体验", "color": "#fff9c4", "note_type": "idea", "x": 80, "y": 80, "created_by": "产品经理"},
        {"content": "增加 AI 智能推荐功能", "color": "#ffecb3", "note_type": "idea", "x": 300, "y": 80, "created_by": "设计师"},
        {"content": "支持深色模式切换", "color": "#dcedc8", "note_type": "idea", "x": 520, "y": 80, "created_by": "开发工程师"},
        {"content": "移动端适配问题较多", "color": "#ffecb3", "note_type": "problem", "x": 80, "y": 220, "created_by": "运营"},
        {"content": "用户反馈搜索功能不好用", "color": "#f8bbd9", "note_type": "problem", "x": 300, "y": 220, "created_by": "产品经理"},
        {"content": "缺少数据导出功能", "color": "#b3e5fc", "note_type": "need", "x": 520, "y": 220, "created_by": "设计师"},
        {"content": "开发专属小程序版本", "color": "#fff9c4", "note_type": "opportunity", "x": 80, "y": 360, "created_by": "开发工程师"},
        {"content": "接入第三方登录（微信/企业微信）", "color": "#dcedc8", "note_type": "need", "x": 300, "y": 360, "created_by": "运营"},
    ]
    note_ids = []
    for n in notes:
        r = api("POST", f"/api/boards/{board_id}/notes", n)
        note_ids.append(r["data"]["id"])
        print(f"  已添加: {n['content'][:20]}...")
    print()

    print("=== 对便签投票 ===")
    for i, nid in enumerate(note_ids[:5]):
        for j in range(3 - (i % 2)):
            api("POST", f"/api/boards/{board_id}/notes/{nid}/vote", {"user_id": f"voter_{nid}_{j}"})
        print(f"  便签 {nid} 投票完成")
    print()

    print("=== 添加分组 ===")
    groups = [
        {"title": "功能优化", "color": "#e3f2fd", "x": 50, "y": 50, "width": 230, "height": 280, "created_by": "主持人"},
        {"title": "问题收集", "color": "#ffebee", "x": 290, "y": 50, "width": 230, "height": 280, "created_by": "主持人"},
        {"title": "新机会", "color": "#e8f5e9", "x": 530, "y": 50, "width": 230, "height": 280, "created_by": "主持人"},
    ]
    for g in groups:
        api("POST", f"/api/boards/{board_id}/groups", g)
        print(f"  已添加: {g['title']}")
    print()

    print("=== 添加行动项 ===")
    actions = [
        {"title": "完成首页性能优化", "assignee": "开发工程师", "status": "in_progress", "priority": "high", "due_date": "2026-06-15"},
        {"title": "输出 AI 功能需求文档", "assignee": "产品经理", "status": "pending", "priority": "high", "due_date": "2026-06-10"},
        {"title": "完成深色模式设计稿", "assignee": "设计师", "status": "completed", "priority": "medium", "due_date": "2026-06-05"},
        {"title": "用户调研搜索体验", "assignee": "运营", "status": "pending", "priority": "medium", "due_date": "2026-06-20"},
    ]
    for a in actions:
        api("POST", f"/api/boards/{board_id}/actions", {**a, "item_type": "action", "created_by": "主持人"})
        print(f"  已添加: {a['title']}")
    print()

    print("=== 验证数据 ===")
    boards = api("GET", "/api/boards")
    print(f"白板总数: {len(boards['data'])}")
    for b in boards["data"]:
        print(f"  - {b['id']}: {b['title']} ({b['status']})")
    print()

    stats = api("GET", f"/api/boards/{board_id}/stats")
    print(f"白板统计:")
    for k, v in stats["data"].items():
        print(f"  - {k}: {v}")
    print()

    review = api("GET", f"/api/boards/{board_id}/review")
    data = review["data"]
    print(f"复盘数据:")
    print(f"  - 参与人数: {len(data['participants'])}")
    print(f"  - 便签数: {len(data['notes'])}")
    print(f"  - 行动项数: {len(data['actions'])}")
    total_votes = sum(n.get("votes_count", 0) for n in data["notes"])
    print(f"  - 总投票数: {total_votes}")
    print(f"  - 热门便签 Top 3:")
    sorted_notes = sorted(data["notes"], key=lambda x: x.get("votes_count", 0), reverse=True)[:3]
    for i, n in enumerate(sorted_notes):
        print(f"    {i+1}. {n['content']} (👍 {n.get('votes_count', 0)})")
    print()

    print("=== 操作历史 ===")
    history = api("GET", f"/api/boards/{board_id}/history")
    print(f"共 {len(history['data'])} 条操作记录")
    for h in history["data"][:5]:
        print(f"  - {h['operation']} by {h['created_by']} at {h['created_at']}")
    print()

    print(f"=== 完成 ===")
    print(f"访问地址: http://127.0.0.1:45476/?board={board_id}")
    print(f"管理后台: http://127.0.0.1:45476/admin.html")

if __name__ == "__main__":
    main()
