from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#3b82f6"


class TagCreate(TagBase):
    pass


class Tag(TagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SourceBase(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = None
    note: Optional[str] = None


class SourceCreate(SourceBase):
    pass


class Source(SourceBase):
    id: int
    entry_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AttachmentBase(BaseModel):
    filename: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class AttachmentCreate(AttachmentBase):
    file_path: str


class Attachment(AttachmentBase):
    id: int
    entry_id: int
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


class EntryRelationBase(BaseModel):
    to_entry_id: int
    relation_type: Optional[str] = "related"


class EntryRelationCreate(EntryRelationBase):
    pass


class EntryRelation(EntryRelationBase):
    id: int
    from_entry_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeEntryBase(BaseModel):
    entry_type: Optional[str] = "note"
    title: Optional[str] = None
    content: Optional[str] = None
    html_content: Optional[str] = None
    source_url: Optional[str] = None
    source_title: Optional[str] = None
    is_private: Optional[bool] = True
    entry_metadata: Optional[Dict[str, Any]] = None


class KnowledgeEntryCreate(KnowledgeEntryBase):
    tags: Optional[List[str]] = None
    sources: Optional[List[SourceCreate]] = None
    relations: Optional[List[EntryRelationCreate]] = None


class KnowledgeEntryUpdate(KnowledgeEntryBase):
    tags: Optional[List[str]] = None
    sources: Optional[List[SourceCreate]] = None
    relations: Optional[List[EntryRelationCreate]] = None


class KnowledgeEntry(KnowledgeEntryBase):
    id: int
    user_id: int
    version: int
    last_modified_at: datetime
    created_at: datetime
    deleted: bool
    tags: List[Tag] = []
    sources: List[Source] = []
    attachments: List[Attachment] = []
    relations_from: List[EntryRelation] = []
    relations_to: List[EntryRelation] = []

    class Config:
        from_attributes = True


class KnowledgeEntryListItem(BaseModel):
    id: int
    title: Optional[str] = None
    content: Optional[str] = None
    entry_type: str
    is_private: bool
    version: int
    last_modified_at: datetime
    created_at: datetime
    tags: List[Tag] = []
    highlight: Optional[str] = None

    class Config:
        from_attributes = True


class SearchResult(BaseModel):
    total: int
    results: List[KnowledgeEntryListItem]


class DeviceBase(BaseModel):
    name: str
    fingerprint: str


class DeviceCreate(DeviceBase):
    pass


class Device(DeviceBase):
    id: int
    user_id: int
    last_sync: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SyncVersionBase(BaseModel):
    entry_id: int
    device_id: int
    version: int
    content_hash: str
    snapshot: Dict[str, Any]


class SyncVersionCreate(SyncVersionBase):
    pass


class SyncVersion(SyncVersionBase):
    id: int
    synced_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class SyncConflictBase(BaseModel):
    entry_id: int
    base_version: int
    local_version_snapshot: Dict[str, Any]
    remote_version_snapshot: Dict[str, Any]
    conflict_reason: str


class SyncConflictCreate(SyncConflictBase):
    pass


class SyncConflictResolve(BaseModel):
    resolution: str
    status: str


class SyncConflict(SyncConflictBase):
    id: int
    status: str
    resolution: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True


class ShareBase(BaseModel):
    entry_id: int
    permission: Optional[str] = "read"
    expires_at: Optional[datetime] = None


class ShareCreate(ShareBase):
    pass


class Share(ShareBase):
    id: int
    user_id: int
    share_token: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class ReviewReminderBase(BaseModel):
    entry_id: int
    scheduled_for: datetime
    interval_days: Optional[int] = 1


class ReviewReminderCreate(ReviewReminderBase):
    pass


class ReviewReminder(ReviewReminderBase):
    id: int
    user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_entries: int
    entries_today: int
    entries_this_week: int
    pending_reviews: int
    orphan_entries: int
    conflict_count: int
    pending_conflicts: int
    top_tags: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]


class OperationLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    target_type: str
    target_id: int
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SyncRequest(BaseModel):
    device_fingerprint: str
    device_name: str
    entries: List[Dict[str, Any]]
    last_sync: Optional[datetime] = None


class SyncResponse(BaseModel):
    status: str
    updated_entries: List[KnowledgeEntry]
    new_entries: List[KnowledgeEntry]
    conflicts: List[SyncConflict]
    server_timestamp: datetime
