#!/usr/bin/env python3
"""直接向 SQLite 插入完整的示例数据，验证业务闭环"""
import sqlite3
import json
from datetime import datetime, timedelta, timezone

DB_PATH = "./data/app.sqlite"

def main():
    print("=" * 60)
    print("创建完整业务闭环示例数据（直接写入 SQLite）")
    print("=" * 60)
    print()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # 1. 创建白板
    print("1. 创建白板...")
    cursor.execute("""
        INSERT INTO boards (title, theme, template, status, meeting_time, output_goal, created_by, permissions, is_anonymous, host_lock, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "产品创新头脑风暴（完整示例）",
        "Q3 产品功能规划与用户体验提升",
        "brainstorm",
        "vote",
        "2026-06-01T14:00",
        "确定下季度重点功能方向，输出可落地的创意点和行动项",
        "主持人",
        "{}",
        0,
        0,
        now,
        now
    ))
    board_id = cursor.lastrowid
    print(f"   ✓ 白板创建成功，ID: {board_id}")
    cursor.execute("""
        INSERT INTO board_participants (board_id, display_name, role, joined_at)
        VALUES (?, ?, ?, ?)
    """, (board_id, "主持人", "host", now))

    # 2. 添加参与人
    print("2. 添加参与人...")
    participants = [
        ("产品经理", "participant"),
        ("设计师", "participant"),
        ("开发工程师", "participant"),
        ("运营", "participant"),
        ("测试工程师", "participant"),
    ]
    for name, role in participants:
        cursor.execute("""
            INSERT INTO board_participants (board_id, display_name, role, joined_at)
            VALUES (?, ?, ?, ?)
        """, (board_id, name, role, now))
        print(f"   ✓ 已添加: {name}")

    # 3. 添加便签
    print("3. 添加便签（按角色分类）...")
    notes = [
        # 产品经理的创意
        ("优化首页加载速度，提升用户体验", "#fff9c4", "idea", 80, 80, "产品经理", 0, '[]'),
        ("增加 AI 智能推荐功能，提高用户停留时间", "#fff9c4", "idea", 300, 80, "产品经理", 0, '[]'),
        ("支持深色模式切换，符合用户偏好", "#fff9c4", "idea", 520, 80, "产品经理", 0, '[]'),
        # 设计师的创意
        ("简化注册流程，减少用户流失", "#ffecb3", "idea", 740, 80, "设计师", 0, '[]'),
        ("优化表单交互体验，提升填写效率", "#ffecb3", "idea", 80, 220, "设计师", 0, '[]'),
        ("统一设计语言，增强品牌识别", "#ffecb3", "idea", 300, 220, "设计师", 0, '[]'),
        # 开发工程师的创意
        ("移动端适配问题较多，需要专项优化", "#dcedc8", "problem", 520, 220, "开发工程师", 0, '[]'),
        ("升级技术栈，提升开发效率", "#dcedc8", "idea", 740, 220, "开发工程师", 0, '[]'),
        ("增加自动化测试覆盖率", "#dcedc8", "need", 80, 360, "开发工程师", 0, '[]'),
        # 运营的创意
        ("用户反馈搜索功能不好用，需要优化", "#f8bbd9", "problem", 300, 360, "运营", 0, '[]'),
        ("缺少数据导出功能，影响运营分析", "#b3e5fc", "need", 520, 360, "运营", 0, '[]'),
        ("开发专属小程序版本，拓展用户触达", "#fff9c4", "opportunity", 740, 360, "运营", 0, '[]'),
        # 测试工程师的创意
        ("接入第三方登录（微信/企业微信）", "#dcedc8", "need", 80, 500, "测试工程师", 0, '[]'),
        ("性能监控和告警机制需要完善", "#ffecb3", "problem", 300, 500, "测试工程师", 0, '[]'),
        ("支持多语言国际化", "#ffecb3", "opportunity", 520, 500, "测试工程师", 0, '[]'),
    ]

    note_ids = []
    for n in notes:
        cursor.execute("""
            INSERT INTO notes (board_id, content, color, note_type, x, y, created_by, is_anonymous, tags, votes_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (board_id, n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7], 0, now, now))
        note_id = cursor.lastrowid
        note_ids.append(note_id)
        print(f"   ✓ {n[5]}: {n[0][:25]}...")

    # 4. 对便签投票（前8条获得更多投票）
    print("4. 对便签投票...")
    voters = ["产品经理", "设计师", "开发工程师", "运营", "测试工程师"]
    total_votes = 0
    for i, nid in enumerate(note_ids):
        # 投票数递减：前几条得票多
        vote_count = max(1, 6 - (i // 2))
        for j in range(vote_count):
            cursor.execute("""
                INSERT INTO votes (note_id, user_id, vote_type, created_at)
                VALUES (?, ?, ?, ?)
            """, (nid, voters[j % len(voters)], "up", now))
            total_votes += 1
        cursor.execute("UPDATE notes SET votes_count = ? WHERE id = ?", (vote_count, nid))
        print(f"   便签 #{nid} 获得 {vote_count} 票")

    print(f"   ✓ 总投票数: {total_votes}")
    print()

    # 5. 添加分组
    print("5. 添加分组...")
    groups = [
        ("功能优化", "#e3f2fd", 50, 50, 250, 180, "主持人"),
        ("用户体验", "#fce4ec", 310, 50, 250, 180, "主持人"),
        ("技术提升", "#e8f5e9", 570, 50, 250, 180, "主持人"),
        ("问题收集", "#fff3e0", 50, 240, 250, 180, "主持人"),
        ("新机会", "#f3e5f5", 310, 240, 250, 180, "主持人"),
        ("需求收集", "#e0f7fa", 570, 240, 250, 180, "主持人"),
    ]
    for g in groups:
        cursor.execute("""
            INSERT INTO note_groups (board_id, title, color, x, y, width, height, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (board_id, g[0], g[1], g[2], g[3], g[4], g[5], g[6], now))
        print(f"   ✓ 已添加: {g[0]}")

    # 6. 添加行动项
    print("6. 添加行动项...")
    actions = [
        ("完成首页性能优化，目标加载时间 < 2s", "开发工程师", "in_progress", "high", "2026-06-15", "主持人"),
        ("输出 AI 智能推荐功能需求文档", "产品经理", "pending", "high", "2026-06-10", "主持人"),
        ("完成深色模式设计稿并评审", "设计师", "completed", "medium", "2026-06-05", "主持人"),
        ("用户调研搜索体验，输出优化方案", "运营", "pending", "medium", "2026-06-20", "主持人"),
        ("移动端适配专项优化方案", "开发工程师", "in_progress", "high", "2026-06-25", "主持人"),
        ("技术栈升级方案评审", "开发工程师", "pending", "medium", "2026-06-30", "主持人"),
        ("自动化测试覆盖率提升到 80%", "测试工程师", "pending", "medium", "2026-07-05", "主持人"),
        ("小程序版本立项和可行性分析", "产品经理", "pending", "low", "2026-07-10", "主持人"),
    ]
    for a in actions:
        cursor.execute("""
            INSERT INTO action_items (board_id, title, item_type, assignee, status, priority, due_date, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (board_id, a[0], "action", a[1], a[2], a[3], a[4], a[5], now))
        print(f"   ✓ [{a[2]}] {a[0][:30]}... (负责人: {a[1]})")

    # 7. 记录操作历史
    print()
    print("7. 记录操作历史...")
    operations = [
        ("create_board", {"board_id": board_id}, "主持人"),
        ("add_participant", {"name": "产品经理"}, "主持人"),
        ("add_participant", {"name": "设计师"}, "主持人"),
        ("add_participant", {"name": "开发工程师"}, "主持人"),
        ("add_participant", {"name": "运营"}, "主持人"),
        ("add_participant", {"name": "测试工程师"}, "主持人"),
        ("add_note", {"note_id": note_ids[0], "content": notes[0][0]}, "产品经理"),
        ("add_note", {"note_id": note_ids[1], "content": notes[1][0]}, "产品经理"),
        ("add_note", {"note_id": note_ids[2], "content": notes[2][0]}, "产品经理"),
        ("add_note", {"note_id": note_ids[3], "content": notes[3][0]}, "设计师"),
        ("add_note", {"note_id": note_ids[4], "content": notes[4][0]}, "设计师"),
        ("add_note", {"note_id": note_ids[5], "content": notes[5][0]}, "设计师"),
        ("add_note", {"note_id": note_ids[6], "content": notes[6][0]}, "开发工程师"),
        ("add_note", {"note_id": note_ids[7], "content": notes[7][0]}, "开发工程师"),
        ("add_note", {"note_id": note_ids[8], "content": notes[8][0]}, "开发工程师"),
        ("add_note", {"note_id": note_ids[9], "content": notes[9][0]}, "运营"),
        ("add_note", {"note_id": note_ids[10], "content": notes[10][0]}, "运营"),
        ("add_note", {"note_id": note_ids[11], "content": notes[11][0]}, "运营"),
        ("add_note", {"note_id": note_ids[12], "content": notes[12][0]}, "测试工程师"),
        ("add_note", {"note_id": note_ids[13], "content": notes[13][0]}, "测试工程师"),
        ("add_note", {"note_id": note_ids[14], "content": notes[14][0]}, "测试工程师"),
        ("vote_note", {"note_id": note_ids[0]}, "设计师"),
        ("vote_note", {"note_id": note_ids[0]}, "开发工程师"),
        ("vote_note", {"note_id": note_ids[0]}, "运营"),
        ("vote_note", {"note_id": note_ids[0]}, "测试工程师"),
        ("vote_note", {"note_id": note_ids[1]}, "产品经理"),
        ("vote_note", {"note_id": note_ids[1]}, "设计师"),
        ("vote_note", {"note_id": note_ids[1]}, "开发工程师"),
        ("vote_note", {"note_id": note_ids[2]}, "产品经理"),
        ("vote_note", {"note_id": note_ids[2]}, "设计师"),
        ("add_group", {"group": "功能优化"}, "主持人"),
        ("add_group", {"group": "用户体验"}, "主持人"),
        ("add_group", {"group": "技术提升"}, "主持人"),
        ("add_group", {"group": "问题收集"}, "主持人"),
        ("add_group", {"group": "新机会"}, "主持人"),
        ("add_group", {"group": "需求收集"}, "主持人"),
        ("add_action", {"action": "完成首页性能优化"}, "主持人"),
        ("add_action", {"action": "输出 AI 功能需求文档"}, "主持人"),
        ("add_action", {"action": "完成深色模式设计稿"}, "主持人"),
        ("add_action", {"action": "用户调研搜索体验"}, "主持人"),
        ("update_board_status", {"old_status": "setup", "new_status": "vote"}, "主持人"),
    ]
    for op, details, user in operations:
        cursor.execute("""
            INSERT INTO operation_history (board_id, operation, data, created_by, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (board_id, op, json.dumps(details, ensure_ascii=False), user, now))
    print(f"   共记录 {len(operations)} 条操作历史")
    print()

    conn.commit()

    # 8. 验证数据完整性
    print("8. 验证数据完整性...")
    participant_count = cursor.execute("SELECT COUNT(*) FROM board_participants WHERE board_id = ?", (board_id,)).fetchone()[0]
    total_notes = cursor.execute("SELECT COUNT(*) FROM notes WHERE board_id = ?", (board_id,)).fetchone()[0]
    total_votes = cursor.execute("SELECT SUM(votes_count) FROM notes WHERE board_id = ?", (board_id,)).fetchone()[0] or 0
    action_count = cursor.execute("SELECT COUNT(*) FROM action_items WHERE board_id = ?", (board_id,)).fetchone()[0]
    completed_actions = cursor.execute("SELECT COUNT(*) FROM action_items WHERE board_id = ? AND status = 'completed'", (board_id,)).fetchone()[0]
    group_count = cursor.execute("SELECT COUNT(*) FROM note_groups WHERE board_id = ?", (board_id,)).fetchone()[0]
    history_count = cursor.execute("SELECT COUNT(*) FROM operation_history WHERE board_id = ?", (board_id,)).fetchone()[0]

    print(f"   ✓ 参与人数: {participant_count}")
    print(f"   ✓ 便签总数: {total_notes}")
    print(f"   ✓ 总投票数: {total_votes}")
    print(f"   ✓ 行动项数: {action_count}")
    print(f"   ✓ 已完成行动项: {completed_actions}")
    print(f"   ✓ 分组数: {group_count}")
    print(f"   ✓ 操作历史: {history_count} 条")
    print()

    # 显示热门便签
    print("9. 热门便签 Top 5:")
    top_notes = cursor.execute("""
        SELECT content, votes_count, created_by FROM notes 
        WHERE board_id = ? 
        ORDER BY votes_count DESC, id ASC 
        LIMIT 5
    """, (board_id,)).fetchall()
    for i, n in enumerate(top_notes):
        print(f"   {i+1}. 👍 {n[1]} 票 - {n[0][:40]}... ({n[2]})")
    print()

    # 显示参与度统计
    print("10. 参与度统计:")
    participation = cursor.execute("""
        SELECT created_by, COUNT(*) as cnt 
        FROM notes 
        WHERE board_id = ? 
        GROUP BY created_by 
        ORDER BY cnt DESC
    """, (board_id,)).fetchall()
    for p in participation:
        print(f"   {p[0]}: {p[1]} 个便签")
    print()

    conn.close()

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
