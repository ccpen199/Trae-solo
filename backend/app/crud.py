import hashlib
import json
import secrets
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc

from . import models, schemas


def get_or_create_user(db: Session, username: str, email: str) -> models.User:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        user = models.User(username=username, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_or_create_device(db: Session, user_id: int, fingerprint: str, name: str) -> models.Device:
    device = db.query(models.Device).filter(models.Device.fingerprint == fingerprint).first()
    if not device:
        device = models.Device(user_id=user_id, fingerprint=fingerprint, name=name)
        db.add(device)
        db.commit()
        db.refresh(device)
    return device


def log_operation(db: Session, user_id: int, action: str, target_type: str, target_id: int,
                  details: Dict = None, ip_address: str = None):
    log = models.OperationLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
        ip_address=ip_address
    )
    db.add(log)
    db.commit()


def get_or_create_tag(db: Session, name: str, color: str = "#3b82f6") -> models.Tag:
    tag = db.query(models.Tag).filter(models.Tag.name == name).first()
    if not tag:
        tag = models.Tag(name=name, color=color)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag


def create_entry(db: Session, user_id: int, entry_data: schemas.KnowledgeEntryCreate) -> models.KnowledgeEntry:
    db_entry = models.KnowledgeEntry(
        user_id=user_id,
        entry_type=entry_data.entry_type,
        title=entry_data.title,
        content=entry_data.content,
        html_content=entry_data.html_content,
        source_url=entry_data.source_url,
        source_title=entry_data.source_title,
        is_private=entry_data.is_private if entry_data.is_private is not None else True,
        entry_metadata=entry_data.entry_metadata or {}
    )
    db.add(db_entry)
    db.flush()

    if entry_data.tags:
        for tag_name in entry_data.tags:
            tag = get_or_create_tag(db, tag_name)
            entry_tag = models.EntryTag(entry_id=db_entry.id, tag_id=tag.id)
            db.add(entry_tag)

    if entry_data.sources:
        for src in entry_data.sources:
            source = models.Source(
                entry_id=db_entry.id,
                url=src.url,
                title=src.title,
                note=src.note
            )
            db.add(source)

    if entry_data.relations:
        for rel in entry_data.relations:
            relation = models.EntryRelation(
                from_entry_id=db_entry.id,
                to_entry_id=rel.to_entry_id,
                relation_type=rel.relation_type
            )
            db.add(relation)

    db.commit()
    db.refresh(db_entry)

    content_hash = hashlib.sha256(
        json.dumps({"title": db_entry.title, "content": db_entry.content}, sort_keys=True).encode()
    ).hexdigest()
    db_version = models.SyncVersion(
        entry_id=db_entry.id,
        device_id=0,
        version=db_entry.version,
        content_hash=content_hash,
        snapshot={
            "title": db_entry.title,
            "content": db_entry.content,
            "html_content": db_entry.html_content,
            "tags": [t.tag.name for t in db_entry.tags],
            "version": db_entry.version
        }
    )
    db.add(db_version)
    db.commit()

    log_operation(db, user_id, "create", "KnowledgeEntry", db_entry.id, {"title": db_entry.title})
    return db_entry


def get_entry(db: Session, entry_id: int, user_id: int) -> Optional[models.KnowledgeEntry]:
    return db.query(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.id == entry_id,
             models.KnowledgeEntry.user_id == user_id,
             models.KnowledgeEntry.deleted == False)
    ).first()


def list_entries(db: Session, user_id: int, skip: int = 0, limit: int = 50,
                 entry_type: str = None, tag: str = None,
                 start_date: datetime = None, end_date: datetime = None) -> Tuple[List[Dict], int]:
    query = db.query(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.user_id == user_id,
             models.KnowledgeEntry.deleted == False)
    )

    if entry_type:
        query = query.filter(models.KnowledgeEntry.entry_type == entry_type)
    if tag:
        query = query.join(models.EntryTag).join(models.Tag).filter(models.Tag.name == tag)
    if start_date:
        query = query.filter(models.KnowledgeEntry.created_at >= start_date)
    if end_date:
        query = query.filter(models.KnowledgeEntry.created_at <= end_date)

    total = query.count()
    entries = query.order_by(desc(models.KnowledgeEntry.last_modified_at)).offset(skip).limit(limit).all()

    result = []
    for entry in entries:
        entry_dict = {c.name: getattr(entry, c.name) for c in entry.__table__.columns}
        entry_dict["tags"] = [{"id": et.tag.id, "name": et.tag.name, "color": et.tag.color} for et in entry.tags]

        relations = db.query(models.EntryRelation).filter(
            or_(models.EntryRelation.from_entry_id == entry.id,
                models.EntryRelation.to_entry_id == entry.id)
        ).all()

        relation_count = len(relations)
        entry_dict["relation_count"] = relation_count

        related_entries = []
        for rel in relations:
            related_id = rel.to_entry_id if rel.from_entry_id == entry.id else rel.from_entry_id
            related_entry = db.query(models.KnowledgeEntry).filter(
                and_(models.KnowledgeEntry.id == related_id,
                     models.KnowledgeEntry.deleted == False)
            ).first()
            if related_entry:
                related_entries.append({
                    "id": related_entry.id,
                    "title": related_entry.title,
                    "entry_type": related_entry.entry_type,
                    "is_private": related_entry.is_private
                })
        entry_dict["related_entries"] = related_entries

        entry_dict["attachments"] = [
            {
                "id": att.id,
                "filename": att.filename,
                "file_size": att.file_size,
                "content_type": att.content_type,
                "created_at": att.created_at
            }
            for att in entry.attachments
        ]

        result.append(entry_dict)

    return result, total


def search_entries(db: Session, user_id: int, keyword: str = None, tags: List[str] = None,
                   source: str = None, start_date: datetime = None, end_date: datetime = None,
                   related_to: int = None, skip: int = 0, limit: int = 50) -> Tuple[List[models.KnowledgeEntry], int, List[Dict]]:
    query = db.query(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.user_id == user_id,
             models.KnowledgeEntry.deleted == False)
    )

    highlights = {}

    if keyword:
        keyword_like = f"%{keyword}%"
        query = query.filter(or_(
            models.KnowledgeEntry.title.like(keyword_like),
            models.KnowledgeEntry.content.like(keyword_like),
            models.KnowledgeEntry.html_content.like(keyword_like)
        ))

    if tags and len(tags) > 0:
        query = query.join(models.EntryTag).join(models.Tag).filter(models.Tag.name.in_(tags))

    if source:
        source_like = f"%{source}%"
        query = query.filter(or_(
            models.KnowledgeEntry.source_url.like(source_like),
            models.KnowledgeEntry.source_title.like(source_like)
        ))

    if start_date:
        query = query.filter(models.KnowledgeEntry.last_modified_at >= start_date)
    if end_date:
        query = query.filter(models.KnowledgeEntry.last_modified_at <= end_date)

    if related_to:
        related_ids = set()
        rels_from = db.query(models.EntryRelation).filter(models.EntryRelation.from_entry_id == related_to).all()
        rels_to = db.query(models.EntryRelation).filter(models.EntryRelation.to_entry_id == related_to).all()
        for r in rels_from:
            related_ids.add(r.to_entry_id)
        for r in rels_to:
            related_ids.add(r.from_entry_id)
        if related_ids:
            query = query.filter(models.KnowledgeEntry.id.in_(related_ids))

    total = query.count()
    entries = query.order_by(desc(models.KnowledgeEntry.last_modified_at)).offset(skip).limit(limit).all()

    highlighted_results = []
    for entry in entries:
        highlight = None
        if keyword:
            content = entry.content or ""
            idx = content.lower().find(keyword.lower())
            if idx >= 0:
                start = max(0, idx - 50)
                end = min(len(content), idx + len(keyword) + 50)
                snippet = content[start:end]
                if start > 0:
                    snippet = "..." + snippet
                if end < len(content):
                    snippet = snippet + "..."
                highlight = snippet
            elif entry.title and keyword.lower() in entry.title.lower():
                highlight = "标题匹配: " + entry.title
        highlighted_results.append({"entry": entry, "highlight": highlight})

    return entries, total, highlighted_results


def update_entry(db: Session, entry_id: int, user_id: int, entry_data: schemas.KnowledgeEntryUpdate) -> Optional[models.KnowledgeEntry]:
    db_entry = get_entry(db, entry_id, user_id)
    if not db_entry:
        return None

    if entry_data.title is not None:
        db_entry.title = entry_data.title
    if entry_data.content is not None:
        db_entry.content = entry_data.content
    if entry_data.html_content is not None:
        db_entry.html_content = entry_data.html_content
    if entry_data.source_url is not None:
        db_entry.source_url = entry_data.source_url
    if entry_data.source_title is not None:
        db_entry.source_title = entry_data.source_title
    if entry_data.entry_type is not None:
        db_entry.entry_type = entry_data.entry_type
    if entry_data.is_private is not None:
        db_entry.is_private = entry_data.is_private
    if entry_data.entry_metadata is not None:
        db_entry.entry_metadata = entry_data.entry_metadata

    db_entry.version += 1
    db_entry.last_modified_at = datetime.utcnow()

    if entry_data.tags is not None:
        db.query(models.EntryTag).filter(models.EntryTag.entry_id == entry_id).delete()
        for tag_name in entry_data.tags:
            tag = get_or_create_tag(db, tag_name)
            entry_tag = models.EntryTag(entry_id=db_entry.id, tag_id=tag.id)
            db.add(entry_tag)

    if entry_data.sources is not None:
        db.query(models.Source).filter(models.Source.entry_id == entry_id).delete()
        for src in entry_data.sources:
            source = models.Source(
                entry_id=db_entry.id,
                url=src.url,
                title=src.title,
                note=src.note
            )
            db.add(source)

    if entry_data.relations is not None:
        db.query(models.EntryRelation).filter(models.EntryRelation.from_entry_id == entry_id).delete()
        for rel in entry_data.relations:
            relation = models.EntryRelation(
                from_entry_id=db_entry.id,
                to_entry_id=rel.to_entry_id,
                relation_type=rel.relation_type
            )
            db.add(relation)

    db.commit()
    db.refresh(db_entry)

    content_hash = hashlib.sha256(
        json.dumps({"title": db_entry.title, "content": db_entry.content}, sort_keys=True).encode()
    ).hexdigest()
    db_version = models.SyncVersion(
        entry_id=db_entry.id,
        device_id=0,
        version=db_entry.version,
        content_hash=content_hash,
        snapshot={
            "title": db_entry.title,
            "content": db_entry.content,
            "html_content": db_entry.html_content,
            "tags": [t.tag.name for t in db_entry.tags],
            "version": db_entry.version
        }
    )
    db.add(db_version)
    db.commit()

    log_operation(db, user_id, "update", "KnowledgeEntry", db_entry.id, {"version": db_entry.version})
    return db_entry


def delete_entry(db: Session, entry_id: int, user_id: int) -> bool:
    db_entry = get_entry(db, entry_id, user_id)
    if not db_entry:
        return False
    db_entry.deleted = True
    db_entry.last_modified_at = datetime.utcnow()
    db.commit()
    log_operation(db, user_id, "delete", "KnowledgeEntry", entry_id)
    return True


def get_related_entries(db: Session, entry_id: int, user_id: int) -> List[models.KnowledgeEntry]:
    related_ids = set()
    rels_from = db.query(models.EntryRelation).filter(models.EntryRelation.from_entry_id == entry_id).all()
    rels_to = db.query(models.EntryRelation).filter(models.EntryRelation.to_entry_id == entry_id).all()
    for r in rels_from:
        related_ids.add(r.to_entry_id)
    for r in rels_to:
        related_ids.add(r.from_entry_id)
    if not related_ids:
        return []
    return db.query(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.id.in_(related_ids),
             models.KnowledgeEntry.user_id == user_id,
             models.KnowledgeEntry.deleted == False)
    ).all()


def list_tags(db: Session) -> List[models.Tag]:
    return db.query(models.Tag).order_by(models.Tag.name).all()


def create_sync_version(db: Session, version_data: schemas.SyncVersionCreate) -> models.SyncVersion:
    db_version = models.SyncVersion(**version_data.model_dump())
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


def get_entry_versions(db: Session, entry_id: int) -> List[models.SyncVersion]:
    return db.query(models.SyncVersion).filter(
        models.SyncVersion.entry_id == entry_id
    ).order_by(desc(models.SyncVersion.version)).all()


def create_sync_conflict(db: Session, conflict_data: schemas.SyncConflictCreate) -> models.SyncConflict:
    db_conflict = models.SyncConflict(**conflict_data.model_dump())
    db.add(db_conflict)
    db.commit()
    db.refresh(db_conflict)
    log_operation(db, 1, "create_conflict", "SyncConflict", db_conflict.id, {"reason": conflict_data.conflict_reason})
    return db_conflict


def list_sync_conflicts(db: Session, user_id: int, status: str = None) -> List[models.SyncConflict]:
    query = db.query(models.SyncConflict).join(
        models.KnowledgeEntry, models.SyncConflict.entry_id == models.KnowledgeEntry.id
    ).filter(models.KnowledgeEntry.user_id == user_id)
    if status:
        query = query.filter(models.SyncConflict.status == status)
    return query.order_by(desc(models.SyncConflict.created_at)).all()


def resolve_sync_conflict(db: Session, conflict_id: int, user_id: int,
                          resolve_data: schemas.SyncConflictResolve) -> Optional[models.SyncConflict]:
    db_conflict = db.query(models.SyncConflict).filter(
        models.SyncConflict.id == conflict_id
    ).join(models.KnowledgeEntry).filter(models.KnowledgeEntry.user_id == user_id).first()
    if not db_conflict:
        return None

    db_conflict.status = resolve_data.status
    db_conflict.resolution = resolve_data.resolution
    db_conflict.resolved_at = datetime.utcnow()
    db_conflict.resolved_by = "user"
    db.commit()
    db.refresh(db_conflict)

    if resolve_data.status in ["resolved_local", "resolved_remote", "merged"]:
        entry = db.query(models.KnowledgeEntry).filter(models.KnowledgeEntry.id == db_conflict.entry_id).first()
        if entry:
            snapshot = None
            if resolve_data.status == "resolved_local":
                snapshot = db_conflict.local_version_snapshot
            elif resolve_data.status == "resolved_remote":
                snapshot = db_conflict.remote_version_snapshot
            if snapshot:
                entry.title = snapshot.get("title", entry.title)
                entry.content = snapshot.get("content", entry.content)
                entry.html_content = snapshot.get("html_content", entry.html_content)
                entry.version += 1
                entry.last_modified_at = datetime.utcnow()
                db.commit()

    log_operation(db, user_id, "resolve_conflict", "SyncConflict", conflict_id, {"status": resolve_data.status})
    return db_conflict


def process_sync(db: Session, user_id: int, device_id: int, sync_data: schemas.SyncRequest) -> schemas.SyncResponse:
    conflicts = []
    updated_entries = []
    new_entries = []

    for entry_data in sync_data.entries:
        entry_id = entry_data.get("id")
        client_version = entry_data.get("version", 1)

        if entry_id:
            server_entry = get_entry(db, entry_id, user_id)
            if server_entry:
                if client_version < server_entry.version:
                    client_hash = hashlib.sha256(
                        json.dumps({"title": entry_data.get("title"), "content": entry_data.get("content")},
                                   sort_keys=True).encode()
                    ).hexdigest()
                    server_hash = hashlib.sha256(
                        json.dumps({"title": server_entry.title, "content": server_entry.content},
                                   sort_keys=True).encode()
                    ).hexdigest()

                    if client_hash != server_hash:
                        conflict = create_sync_conflict(db, schemas.SyncConflictCreate(
                            entry_id=entry_id,
                            base_version=client_version,
                            local_version_snapshot=entry_data,
                            remote_version_snapshot={
                                "title": server_entry.title,
                                "content": server_entry.content,
                                "html_content": server_entry.html_content,
                                "version": server_entry.version
                            },
                            conflict_reason="版本冲突：客户端版本落后于服务器版本"
                        ))
                        conflicts.append(conflict)
                    else:
                        updated_entries.append(server_entry)
                else:
                    update_data = schemas.KnowledgeEntryUpdate(
                        title=entry_data.get("title"),
                        content=entry_data.get("content"),
                        html_content=entry_data.get("html_content"),
                        entry_type=entry_data.get("entry_type", "note"),
                        tags=entry_data.get("tags")
                    )
                    updated = update_entry(db, entry_id, user_id, update_data)
                    if updated:
                        updated_entries.append(updated)
            else:
                new_entry_data = schemas.KnowledgeEntryCreate(
                    entry_type=entry_data.get("entry_type", "note"),
                    title=entry_data.get("title"),
                    content=entry_data.get("content"),
                    html_content=entry_data.get("html_content"),
                    tags=entry_data.get("tags")
                )
                new_entry = create_entry(db, user_id, new_entry_data)
                new_entries.append(new_entry)
        else:
            new_entry_data = schemas.KnowledgeEntryCreate(
                entry_type=entry_data.get("entry_type", "note"),
                title=entry_data.get("title"),
                content=entry_data.get("content"),
                html_content=entry_data.get("html_content"),
                tags=entry_data.get("tags")
            )
            new_entry = create_entry(db, user_id, new_entry_data)
            new_entries.append(new_entry)

    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if device:
        device.last_sync = datetime.utcnow()
        db.commit()

    return schemas.SyncResponse(
        status="completed" if not conflicts else "has_conflicts",
        updated_entries=updated_entries,
        new_entries=new_entries,
        conflicts=conflicts,
        server_timestamp=datetime.utcnow()
    )


def create_share(db: Session, user_id: int, share_data: schemas.ShareCreate) -> models.Share:
    token = secrets.token_urlsafe(32)
    db_share = models.Share(
        entry_id=share_data.entry_id,
        user_id=user_id,
        share_token=token,
        permission=share_data.permission,
        expires_at=share_data.expires_at
    )
    db.add(db_share)
    db.commit()
    db.refresh(db_share)
    log_operation(db, user_id, "create_share", "Share", db_share.id, {"permission": share_data.permission})
    return db_share


def get_share(db: Session, token: str) -> Optional[models.Share]:
    share = db.query(models.Share).filter(
        and_(models.Share.share_token == token,
             models.Share.is_active == True)
    ).first()
    if share and share.expires_at and share.expires_at < datetime.utcnow():
        share.is_active = False
        db.commit()
        return None
    return share


def list_shares(db: Session, user_id: int) -> List[models.Share]:
    return db.query(models.Share).filter(
        models.Share.user_id == user_id
    ).order_by(desc(models.Share.created_at)).all()


def deactivate_share(db: Session, share_id: int, user_id: int) -> bool:
    share = db.query(models.Share).filter(
        and_(models.Share.id == share_id, models.Share.user_id == user_id)
    ).first()
    if not share:
        return False
    share.is_active = False
    db.commit()
    log_operation(db, user_id, "deactivate_share", "Share", share_id)
    return True


def create_review_reminder(db: Session, user_id: int, reminder_data: schemas.ReviewReminderCreate) -> models.ReviewReminder:
    db_reminder = models.ReviewReminder(
        entry_id=reminder_data.entry_id,
        user_id=user_id,
        scheduled_for=reminder_data.scheduled_for,
        interval_days=reminder_data.interval_days or 1
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


def list_review_reminders(db: Session, user_id: int, status: str = None) -> List[models.ReviewReminder]:
    query = db.query(models.ReviewReminder).filter(models.ReviewReminder.user_id == user_id)
    if status:
        query = query.filter(models.ReviewReminder.status == status)
    return query.order_by(models.ReviewReminder.scheduled_for).all()


def update_review_reminder_status(db: Session, reminder_id: int, user_id: int, status: str) -> Optional[models.ReviewReminder]:
    reminder = db.query(models.ReviewReminder).filter(
        and_(models.ReviewReminder.id == reminder_id, models.ReviewReminder.user_id == user_id)
    ).first()
    if not reminder:
        return None
    reminder.status = status
    if status == "reviewed":
        next_scheduled = datetime.utcnow() + timedelta(days=reminder.interval_days * 2)
        new_reminder = models.ReviewReminder(
            entry_id=reminder.entry_id,
            user_id=user_id,
            scheduled_for=next_scheduled,
            interval_days=reminder.interval_days * 2
        )
        db.add(new_reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def get_stats(db: Session, user_id: int) -> Dict[str, Any]:
    today = datetime.utcnow().date()
    week_ago = datetime.utcnow() - timedelta(days=7)

    total_entries = db.query(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.user_id == user_id, models.KnowledgeEntry.deleted == False)
    ).count()

    entries_today = db.query(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.user_id == user_id,
             models.KnowledgeEntry.deleted == False,
             func.date(models.KnowledgeEntry.created_at) == today)
    ).count()

    entries_this_week = db.query(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.user_id == user_id,
             models.KnowledgeEntry.deleted == False,
             models.KnowledgeEntry.created_at >= week_ago)
    ).count()

    pending_reviews = db.query(models.ReviewReminder).filter(
        and_(models.ReviewReminder.user_id == user_id,
             models.ReviewReminder.status == "pending",
             models.ReviewReminder.scheduled_for <= datetime.utcnow())
    ).count()

    all_entries = db.query(models.KnowledgeEntry.id).filter(
        and_(models.KnowledgeEntry.user_id == user_id, models.KnowledgeEntry.deleted == False)
    ).all()
    all_entry_ids = {e.id for e in all_entries}

    related_ids = set()
    rels = db.query(models.EntryRelation).all()
    for r in rels:
        if r.from_entry_id in all_entry_ids:
            related_ids.add(r.from_entry_id)
        if r.to_entry_id in all_entry_ids:
            related_ids.add(r.to_entry_id)
    orphan_entries = len(all_entry_ids - related_ids)

    conflict_count = db.query(models.SyncConflict).join(
        models.KnowledgeEntry, models.SyncConflict.entry_id == models.KnowledgeEntry.id
    ).filter(models.KnowledgeEntry.user_id == user_id).count()

    pending_conflicts = db.query(models.SyncConflict).join(
        models.KnowledgeEntry, models.SyncConflict.entry_id == models.KnowledgeEntry.id
    ).filter(and_(models.KnowledgeEntry.user_id == user_id, models.SyncConflict.status == "pending")).count()

    top_tags = db.query(
        models.Tag.name, models.Tag.color, func.count(models.EntryTag.id).label("count")
    ).join(models.EntryTag).join(models.KnowledgeEntry).filter(
        and_(models.KnowledgeEntry.user_id == user_id, models.KnowledgeEntry.deleted == False)
    ).group_by(models.Tag.id).order_by(desc("count")).limit(10).all()

    recent_activity = db.query(models.OperationLog).filter(
        models.OperationLog.user_id == user_id
    ).order_by(desc(models.OperationLog.created_at)).limit(20).all()

    return {
        "total_entries": total_entries,
        "entries_today": entries_today,
        "entries_this_week": entries_this_week,
        "pending_reviews": pending_reviews,
        "orphan_entries": orphan_entries,
        "conflict_count": conflict_count,
        "pending_conflicts": pending_conflicts,
        "top_tags": [{"name": t.name, "color": t.color, "count": t.count} for t in top_tags],
        "recent_activity": [
            {"action": a.action, "target_type": a.target_type, "target_id": a.target_id,
             "details": a.details, "created_at": a.created_at.isoformat() if a.created_at else None}
            for a in recent_activity
        ]
    }


def list_operation_logs(db: Session, user_id: int = None, limit: int = 100) -> List[models.OperationLog]:
    query = db.query(models.OperationLog)
    if user_id:
        query = query.filter(models.OperationLog.user_id == user_id)
    return query.order_by(desc(models.OperationLog.created_at)).limit(limit).all()
