import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from dotenv import load_dotenv

from . import models, schemas, crud
from .database import engine, get_db

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", "43487"))
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "53487"))

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Knowledge Sync API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://127.0.0.1:{FRONTEND_PORT}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = os.path.join(os.path.dirname(__file__), '../../data/uploads')
os.makedirs(uploads_dir, exist_ok=True)

DEFAULT_USER_ID = 1


def get_current_user_id():
    return DEFAULT_USER_ID


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    crud.get_or_create_user(db, username="demo", email="demo@example.com")
    db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/users/me", response_model=schemas.User)
def get_current_user(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/entries")
def list_entries(
    skip: int = 0, limit: int = 50,
    entry_type: Optional[str] = None,
    tag: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    entries, total = crud.list_entries(db, user_id, skip, limit, entry_type, tag, start_date, end_date)
    return {
        "total": total,
        "results": entries
    }


@app.get("/api/entries/search")
def search_entries(
    keyword: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    source: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    related_to: Optional[int] = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    entries, total, highlighted = crud.search_entries(
        db, user_id, keyword, tags, source, start_date, end_date, related_to, skip, limit
    )
    result_entries = []
    for item in highlighted:
        e = item["entry"]
        entry_dict = {c.name: getattr(e, c.name) for c in e.__table__.columns}
        entry_dict["tags"] = [{"id": et.tag.id, "name": et.tag.name, "color": et.tag.color} for et in e.tags]

        rels = db.query(models.EntryRelation).filter(
            or_(models.EntryRelation.from_entry_id == e.id,
                models.EntryRelation.to_entry_id == e.id)
        ).all()
        related_list = []
        for rel in rels:
            rid = rel.to_entry_id if rel.from_entry_id == e.id else rel.from_entry_id
            re = db.query(models.KnowledgeEntry).filter(
                models.KnowledgeEntry.id == rid,
                models.KnowledgeEntry.deleted == False
            ).first()
            if re:
                related_list.append({"id": re.id, "title": re.title, "entry_type": re.entry_type, "is_private": re.is_private})
        entry_dict["related_entries"] = related_list
        entry_dict["relation_count"] = len(rels)
        entry_dict["attachments"] = [{"id": a.id, "filename": a.filename, "file_size": a.file_size, "content_type": a.content_type, "created_at": a.created_at} for a in e.attachments]

        highlight_data = item.get("highlight")
        if keyword:
            entry_dict["highlight"] = {
                "title": e.title if e.title and keyword.lower() in e.title.lower() else None,
                "content": highlight_data if isinstance(highlight_data, str) and not highlight_data.startswith("标题匹配") else None,
                "source": e.source_title if e.source_title and keyword.lower() in e.source_title.lower() else None
            }
        else:
            entry_dict["highlight"] = None

        result_entries.append(entry_dict)
    return {"total": total, "results": result_entries}


@app.get("/api/entries/{entry_id}", response_model=schemas.KnowledgeEntry)
def get_entry(entry_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    entry = crud.get_entry(db, entry_id, user_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@app.post("/api/entries", response_model=schemas.KnowledgeEntry)
def create_entry(
    entry_data: schemas.KnowledgeEntryCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return crud.create_entry(db, user_id, entry_data)


@app.put("/api/entries/{entry_id}", response_model=schemas.KnowledgeEntry)
def update_entry(
    entry_id: int,
    entry_data: schemas.KnowledgeEntryUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    entry = crud.update_entry(db, entry_id, user_id, entry_data)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    success = crud.delete_entry(db, entry_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "success"}


@app.get("/api/entries/{entry_id}/related", response_model=List[schemas.KnowledgeEntryListItem])
def get_related_entries(entry_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    entries = crud.get_related_entries(db, entry_id, user_id)
    return [
        schemas.KnowledgeEntryListItem(
            id=e.id, title=e.title, content=e.content, entry_type=e.entry_type,
            is_private=e.is_private, version=e.version, last_modified_at=e.last_modified_at,
            created_at=e.created_at, tags=[schemas.Tag.from_orm(t.tag) for t in e.tags]
        )
        for e in entries
    ]


@app.get("/api/entries/{entry_id}/versions", response_model=List[schemas.SyncVersion])
def get_entry_versions(entry_id: int, db: Session = Depends(get_db)):
    return crud.get_entry_versions(db, entry_id)


@app.get("/api/tags", response_model=List[schemas.Tag])
def list_tags(db: Session = Depends(get_db)):
    return crud.list_tags(db)


@app.post("/api/devices", response_model=schemas.Device)
def register_device(
    device_data: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return crud.get_or_create_device(db, user_id, device_data.fingerprint, device_data.name)


@app.post("/api/sync", response_model=schemas.SyncResponse)
def sync_data(
    sync_data: schemas.SyncRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    device = crud.get_or_create_device(db, user_id, sync_data.device_fingerprint, sync_data.device_name)
    return crud.process_sync(db, user_id, device.id, sync_data)


@app.get("/api/conflicts", response_model=List[schemas.SyncConflict])
def list_conflicts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return crud.list_sync_conflicts(db, user_id, status)


@app.post("/api/conflicts/{conflict_id}/resolve", response_model=schemas.SyncConflict)
def resolve_conflict(
    conflict_id: int,
    resolve_data: schemas.SyncConflictResolve,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    conflict = crud.resolve_sync_conflict(db, conflict_id, user_id, resolve_data)
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return conflict


@app.get("/api/shares", response_model=List[schemas.Share])
def list_shares(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return crud.list_shares(db, user_id)


@app.post("/api/shares", response_model=schemas.Share)
def create_share(
    share_data: schemas.ShareCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return crud.create_share(db, user_id, share_data)


@app.delete("/api/shares/{share_id}")
def deactivate_share(share_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    success = crud.deactivate_share(db, share_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Share not found")
    return {"status": "success"}


@app.get("/api/shares/public/{token}")
def get_public_share(token: str, db: Session = Depends(get_db)):
    share = crud.get_share(db, token)
    if not share:
        raise HTTPException(status_code=404, detail="Share not found or expired")
    entry = crud.get_entry(db, share.entry_id, share.user_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {
        "share": schemas.Share.from_orm(share),
        "entry": schemas.KnowledgeEntry.from_orm(entry)
    }


@app.get("/api/reviews", response_model=List[schemas.ReviewReminder])
def list_reviews(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return crud.list_review_reminders(db, user_id, status)


@app.post("/api/reviews", response_model=schemas.ReviewReminder)
def create_review(
    reminder_data: schemas.ReviewReminderCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    return crud.create_review_reminder(db, user_id, reminder_data)


@app.put("/api/reviews/{reminder_id}/status", response_model=schemas.ReviewReminder)
def update_review_status(
    reminder_id: int,
    status: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    reminder = crud.update_review_reminder_status(db, reminder_id, user_id, status)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return crud.get_stats(db, user_id)


@app.get("/api/admin/logs", response_model=List[schemas.OperationLogResponse])
def get_operation_logs(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud.list_operation_logs(db, limit=limit)


@app.get("/api/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_entries = db.query(models.KnowledgeEntry).filter(models.KnowledgeEntry.deleted == False).count()
    total_tags = db.query(models.Tag).count()
    total_conflicts = db.query(models.SyncConflict).count()
    total_shares = db.query(models.Share).count()
    pending_conflicts = db.query(models.SyncConflict).filter(models.SyncConflict.status == "pending").count()
    active_devices = db.query(models.Device).count()

    entries_by_type = db.query(
        models.KnowledgeEntry.entry_type,
        func.count(models.KnowledgeEntry.id)
    ).filter(models.KnowledgeEntry.deleted == False).group_by(models.KnowledgeEntry.entry_type).all()

    return {
        "total_users": total_users,
        "total_entries": total_entries,
        "total_tags": total_tags,
        "total_conflicts": total_conflicts,
        "total_shares": total_shares,
        "pending_conflicts": pending_conflicts,
        "active_devices": active_devices,
        "entries_by_type": [{"type": t, "count": c} for t, c in entries_by_type]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=BACKEND_PORT,
        log_level="info"
    )
