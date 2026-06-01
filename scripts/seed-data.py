#!/usr/bin/env python3
"""
测试样例数据生成脚本
包含：正常、边界、冲突、失败四类测试用例
"""
import sys
import os
import json
import hashlib
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.models import (
    User, KnowledgeEntry, Tag, EntryTag, Source, Attachment,
    EntryRelation, SyncVersion, SyncConflict, Share, ReviewReminder, OperationLog
)
from app.database import Base, DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def content_hash(title, content):
    return hashlib.sha256(
        json.dumps({"title": title, "content": content}, sort_keys=True).encode()
    ).hexdigest()


def seed_normal_cases(db):
    """正常场景测试用例"""
    print("\n=== 生成正常测试用例 ===")

    tags_data = [
        ("Python", "#3572A5"),
        ("机器学习", "#FF6B6B"),
        ("产品设计", "#4ECDC4"),
        ("读书笔记", "#FFE66D"),
        ("待整理", "#95A5A6"),
    ]
    tags = []
    for name, color in tags_data:
        tag = Tag(name=name, color=color)
        db.add(tag)
        tags.append(tag)
    db.flush()

    entries_data = [
        {
            "title": "Python 装饰器详解",
            "content": "装饰器是Python中一种强大的语法糖，用于在不修改原函数代码的情况下扩展函数功能。\n\n常见应用场景：\n1. 日志记录\n2. 性能统计\n3. 权限验证\n4. 缓存处理",
            "entry_type": "note",
            "tags": [0],
            "source_url": "https://docs.python.org/3/glossary.html#term-decorator",
            "source_title": "Python官方文档"
        },
        {
            "title": "机器学习模型调参最佳实践",
            "content": "在训练机器学习模型时，合理的参数调优可以显著提升模型性能。\n\n主要方法包括：\n- 网格搜索 (Grid Search)\n- 随机搜索 (Random Search)\n- 贝叶斯优化 (Bayesian Optimization)\n\n建议从默认参数开始，逐步调整关键超参数。",
            "entry_type": "web_clipping",
            "tags": [1],
            "source_url": "https://scikit-learn.org/stable/modules/grid_search.html",
            "source_title": "Scikit-learn Documentation"
        },
        {
            "title": "《深度工作》读书笔记",
            "content": "核心观点：\n1. 深度工作是在无干扰状态下进行的职业活动，能够将认知能力推向极限\n2. 深度工作能够创造新价值，提升技能，并且难以复制\n3. 要在工作中培养深度工作的习惯，需要刻意练习和系统方法\n\n实践建议：\n- 选择适合自己的深度工作模式\n- 建立固定的深度工作仪式\n- 像经营企业一样经营自己的时间",
            "entry_type": "note",
            "tags": [3, 2],
            "source_title": "《深度工作》卡尔·纽波特"
        },
        {
            "title": "用户界面设计原则",
            "content": "优秀的UI设计应当遵循以下原则：\n\n1. 一致性原则\n   - 相同的操作应当产生相同的结果\n   - 视觉元素保持统一风格\n\n2. 反馈原则\n   - 用户操作应当有即时反馈\n   - 错误信息应当清晰明确\n\n3. 简洁原则\n   - 界面元素不应冗余\n   - 突出核心功能",
            "entry_type": "handwritten",
            "tags": [2],
        },
        {
            "title": "待分类的临时想法",
            "content": "这是一个临时记录的想法，需要后续整理。\n可能和项目管理有关。",
            "entry_type": "note",
            "tags": [4],
        }
    ]

    entries = []
    for idx, data in enumerate(entries_data):
        entry = KnowledgeEntry(
            user_id=1,
            entry_type=data["entry_type"],
            title=data["title"],
            content=data["content"],
            source_url=data.get("source_url"),
            source_title=data.get("source_title"),
            is_private=True,
            version=1
        )
        db.add(entry)
        db.flush()

        for tag_idx in data["tags"]:
            entry_tag = EntryTag(entry_id=entry.id, tag_id=tags[tag_idx].id)
            db.add(entry_tag)

        if data.get("source_url") or data.get("source_title"):
            source = Source(
                entry_id=entry.id,
                url=data.get("source_url"),
                title=data.get("source_title"),
                note="从网页剪藏导入"
            )
            db.add(source)

        content_hash_val = content_hash(entry.title, entry.content)
        version = SyncVersion(
            entry_id=entry.id,
            device_id=1,
            version=1,
            content_hash=content_hash_val,
            snapshot={
                "title": entry.title,
                "content": entry.content,
                "tags": [tags[i].name for i in data["tags"]],
                "version": 1
            }
        )
        db.add(version)

        entries.append(entry)
        print(f"  ✓ 创建条目: {data['title']}")

    relation = EntryRelation(
        from_entry_id=entries[0].id,
        to_entry_id=entries[1].id,
        relation_type="reference"
    )
    db.add(relation)
    print(f"  ✓ 创建关联: {entries[0].title} -> {entries[1].title}")

    reminder = ReviewReminder(
        entry_id=entries[2].id,
        user_id=1,
        scheduled_for=datetime.now() + timedelta(days=1),
        interval_days=1
    )
    db.add(reminder)
    print(f"  ✓ 创建复习提醒: {entries[2].title}")

    share = Share(
        entry_id=entries[0].id,
        user_id=1,
        share_token="demo-share-token-12345",
        permission="read",
        expires_at=datetime.now() + timedelta(days=7)
    )
    db.add(share)
    print(f"  ✓ 创建分享: {entries[0].title}")

    db.commit()
    return entries


def seed_boundary_cases(db):
    """边界场景测试用例"""
    print("\n=== 生成边界测试用例 ===")

    long_title = "A" * 200
    long_content = "B" * 5000
    empty_title_entry = KnowledgeEntry(
        user_id=1,
        entry_type="note",
        title=None,
        content="这是一个没有标题的笔记，用于测试边界情况。",
        is_private=False,
        version=1
    )
    db.add(empty_title_entry)
    db.flush()
    print(f"  ✓ 创建无标题条目: ID={empty_title_entry.id}")

    long_entry = KnowledgeEntry(
        user_id=1,
        entry_type="note",
        title=long_title,
        content=long_content,
        is_private=True,
        version=1
    )
    db.add(long_entry)
    db.flush()
    print(f"  ✓ 创建超长内容条目: 标题{len(long_title)}字, 内容{len(long_content)}字")

    many_tags_entry = KnowledgeEntry(
        user_id=1,
        entry_type="note",
        title="多标签测试条目",
        content="这个条目有很多标签，用于测试多标签场景。",
        is_private=True,
        version=1
    )
    db.add(many_tags_entry)
    db.flush()

    all_tags = db.query(Tag).all()
    for tag in all_tags:
        entry_tag = EntryTag(entry_id=many_tags_entry.id, tag_id=tag.id)
        db.add(entry_tag)
    print(f"  ✓ 创建多标签条目: {len(all_tags)}个标签")

    public_entry = KnowledgeEntry(
        user_id=1,
        entry_type="note",
        title="公开的知识条目",
        content="这是一个公开的条目，可以被分享和协作。",
        is_private=False,
        version=1
    )
    db.add(public_entry)
    print(f"  ✓ 创建公开条目")

    entry_no_tags = KnowledgeEntry(
        user_id=1,
        entry_type="note",
        title="无标签孤立条目",
        content="这个条目没有任何标签，也没有关联，用于测试孤立条目统计。",
        is_private=True,
        version=1
    )
    db.add(entry_no_tags)
    print(f"  ✓ 创建孤立条目（无标签无关联）")

    db.commit()


def seed_conflict_cases(db):
    """冲突场景测试用例"""
    print("\n=== 生成冲突测试用例 ===")

    base_entry = KnowledgeEntry(
        user_id=1,
        entry_type="note",
        title="可能产生冲突的文档",
        content="这是原始版本的内容。\n\n第一版本。",
        is_private=True,
        version=3
    )
    db.add(base_entry)
    db.flush()

    tag = db.query(Tag).first()
    if tag:
        entry_tag = EntryTag(entry_id=base_entry.id, tag_id=tag.id)
        db.add(entry_tag)

    v1_hash = content_hash("可能产生冲突的文档", "这是原始版本的内容。\n\n第一版本。")
    v1 = SyncVersion(
        entry_id=base_entry.id,
        device_id=1,
        version=1,
        content_hash=v1_hash,
        snapshot={
            "title": "可能产生冲突的文档",
            "content": "这是原始版本的内容。\n\n第一版本。",
            "version": 1
        }
    )
    db.add(v1)

    v2_hash = content_hash("可能产生冲突的文档", "这是设备A修改后的内容。\n\n第二版本，增加了新段落。")
    v2 = SyncVersion(
        entry_id=base_entry.id,
        device_id=1,
        version=2,
        content_hash=v2_hash,
        snapshot={
            "title": "可能产生冲突的文档",
            "content": "这是设备A修改后的内容。\n\n第二版本，增加了新段落。",
            "version": 2
        }
    )
    db.add(v2)

    v3_hash = content_hash("可能产生冲突的文档", "这是服务器最新版本。\n\n第三版本，包含更多信息。")
    v3 = SyncVersion(
        entry_id=base_entry.id,
        device_id=2,
        version=3,
        content_hash=v3_hash,
        snapshot={
            "title": "可能产生冲突的文档",
            "content": "这是服务器最新版本。\n\n第三版本，包含更多信息。",
            "version": 3
        }
    )
    db.add(v3)

    conflict = SyncConflict(
        entry_id=base_entry.id,
        base_version=2,
        local_version_snapshot={
            "title": "可能产生冲突的文档",
            "content": "这是客户端离线编辑的内容。\n\n第二版本，客户端修改。",
            "version": 2
        },
        remote_version_snapshot={
            "title": "可能产生冲突的文档",
            "content": "这是服务器最新版本。\n\n第三版本，包含更多信息。",
            "version": 3
        },
        conflict_reason="版本冲突：客户端版本落后于服务器版本",
        status="pending"
    )
    db.add(conflict)
    print(f"  ✓ 创建待处理冲突: 条目ID={base_entry.id}")

    resolved_conflict = SyncConflict(
        entry_id=base_entry.id,
        base_version=1,
        local_version_snapshot={
            "title": "可能产生冲突的文档",
            "content": "本地版本",
            "version": 1
        },
        remote_version_snapshot={
            "title": "可能产生冲突的文档",
            "content": "远程版本",
            "version": 2
        },
        conflict_reason="版本冲突：测试已解决的冲突",
        status="resolved_remote",
        resolution="自动选择保留远程版本",
        resolved_at=datetime.now() - timedelta(hours=2),
        resolved_by="system"
    )
    db.add(resolved_conflict)
    print(f"  ✓ 创建已解决冲突")

    db.commit()
    return base_entry


def seed_failure_cases(db):
    """失败/错误场景测试用例"""
    print("\n=== 生成失败测试用例 ===")

    expired_share = Share(
        entry_id=1,
        user_id=1,
        share_token="expired-token-12345",
        permission="read",
        expires_at=datetime.now() - timedelta(days=1),
        is_active=True
    )
    db.add(expired_share)
    print(f"  ✓ 创建已过期分享链接")

    inactive_share = Share(
        entry_id=1,
        user_id=1,
        share_token="inactive-token-12345",
        permission="edit",
        is_active=False
    )
    db.add(inactive_share)
    print(f"  ✓ 创建已失效分享链接")

    old_review = ReviewReminder(
        entry_id=1,
        user_id=1,
        scheduled_for=datetime.now() - timedelta(days=5),
        interval_days=1,
        status="pending"
    )
    db.add(old_review)
    print(f"  ✓ 创建逾期复习提醒")

    skipped_review = ReviewReminder(
        entry_id=1,
        user_id=1,
        scheduled_for=datetime.now() - timedelta(days=3),
        interval_days=1,
        status="skipped"
    )
    db.add(skipped_review)
    print(f"  ✓ 创建已跳过复习提醒")

    db.commit()


def verify_database(db):
    """验证数据库数据"""
    print("\n=== 数据库验证 ===")

    counts = {
        "用户": db.query(User).count(),
        "知识条目": db.query(KnowledgeEntry).filter(KnowledgeEntry.deleted == False).count(),
        "标签": db.query(Tag).count(),
        "同步版本": db.query(SyncVersion).count(),
        "同步冲突": db.query(SyncConflict).count(),
        "待处理冲突": db.query(SyncConflict).filter(SyncConflict.status == "pending").count(),
        "分享链接": db.query(Share).count(),
        "复习提醒": db.query(ReviewReminder).count(),
        "操作日志": db.query(OperationLog).count(),
    }

    for name, count in counts.items():
        print(f"  {name}: {count}")

    return counts


def main():
    print("=" * 50)
    print("Knowledge Sync 测试数据生成工具")
    print("=" * 50)
    print(f"数据库: {DATABASE_URL}")
    print(f"生成时间: {datetime.now().isoformat()}")

    db = SessionLocal()

    try:
        user = db.query(User).filter(User.username == "demo").first()
        if not user:
            user = User(username="demo", email="demo@example.com")
            db.add(user)
            db.commit()
            db.refresh(user)
        print(f"用户: {user.username} (ID={user.id})")

        entries = seed_normal_cases(db)
        seed_boundary_cases(db)
        conflict_entry = seed_conflict_cases(db)
        seed_failure_cases(db)
        counts = verify_database(db)

        print("\n" + "=" * 50)
        print("测试数据生成完成！")
        print("=" * 50)
        print("\n测试路径说明:")
        print("  1. 正常场景:")
        print(f"     - 知识条目列表: GET /api/entries (预计返回 {counts['知识条目']}+ 条)")
        print(f"     - 条目详情: GET /api/entries/1")
        print(f"     - 全文检索: GET /api/entries/search?keyword=Python")
        print(f"     - 标签搜索: GET /api/entries/search?tags=Python")
        print(f"     - 关联条目: GET /api/entries/1/related")
        print(f"     - 版本历史: GET /api/entries/1/versions")
        print("\n  2. 边界场景:")
        print(f"     - 无标题条目: GET /api/entries/{entries[0].id + 5 if len(entries) > 0 else 'N/A'}")
        print(f"     - 公开条目: GET /api/entries/search")
        print(f"     - 多标签条目: 标签数量 >= 5")
        print("\n  3. 冲突场景:")
        print(f"     - 待处理冲突: GET /api/conflicts?status=pending (预计 {counts['待处理冲突']} 条)")
        print(f"     - 冲突详情对比: GET /api/conflicts")
        print(f"     - 解决冲突: POST /api/conflicts/{conflict_entry.id if conflict_entry else 'N/A'}/resolve")
        print("\n  4. 失败场景:")
        print(f"     - 过期分享: GET /api/shares/public/expired-token-12345 (返回404)")
        print(f"     - 无效Token: GET /api/shares/public/invalid-token (返回404)")
        print(f"     - 不存在条目: GET /api/entries/99999 (返回404)")
        print("\n导出核对:")
        print(f"  - 数据库文件: data/app.sqlite")
        print(f"  - 可使用 sqlite3 命令查询: sqlite3 data/app.sqlite '.tables'")
        print(f"  - 导出为 SQL: sqlite3 data/app.sqlite '.dump' > backup.sql")

    except Exception as e:
        print(f"\n错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
