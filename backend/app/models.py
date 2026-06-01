from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    devices = relationship("Device", back_populates="owner")
    entries = relationship("KnowledgeEntry", back_populates="owner")
    shares = relationship("Share", back_populates="owner")


class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    fingerprint = Column(String(100), unique=True, index=True)
    last_sync = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="devices")
    versions = relationship("SyncVersion", back_populates="device")


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    entry_type = Column(String(20), default="note")  # note, web_clipping, handwritten, file
    title = Column(String(200))
    content = Column(Text)
    html_content = Column(Text)
    source_url = Column(String(500))
    source_title = Column(String(200))
    is_private = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    last_modified_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted = Column(Boolean, default=False)
    entry_metadata = Column(JSON, default=dict)

    owner = relationship("User", back_populates="entries")
    tags = relationship("EntryTag", back_populates="entry", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="entry", cascade="all, delete-orphan")
    sources = relationship("Source", back_populates="entry", cascade="all, delete-orphan")
    relations_from = relationship("EntryRelation", foreign_keys="EntryRelation.from_entry_id", back_populates="from_entry", cascade="all, delete-orphan")
    relations_to = relationship("EntryRelation", foreign_keys="EntryRelation.to_entry_id", back_populates="to_entry", cascade="all, delete-orphan")
    versions = relationship("SyncVersion", back_populates="entry")
    shares = relationship("Share", back_populates="entry")
    review_reminders = relationship("ReviewReminder", back_populates="entry")


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    color = Column(String(7), default="#3b82f6")
    created_at = Column(DateTime, default=datetime.utcnow)

    entries = relationship("EntryTag", back_populates="tag")


class EntryTag(Base):
    __tablename__ = "entry_tags"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    tag_id = Column(Integer, ForeignKey("tags.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("KnowledgeEntry", back_populates="tags")
    tag = relationship("Tag", back_populates="entries")


class Source(Base):
    __tablename__ = "sources"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    url = Column(String(500))
    title = Column(String(200))
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("KnowledgeEntry", back_populates="sources")


class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    filename = Column(String(200))
    file_path = Column(String(500))
    file_type = Column(String(50))
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("KnowledgeEntry", back_populates="attachments")


class EntryRelation(Base):
    __tablename__ = "entry_relations"
    id = Column(Integer, primary_key=True, index=True)
    from_entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    to_entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    relation_type = Column(String(20), default="related")  # related, reference, child
    created_at = Column(DateTime, default=datetime.utcnow)

    from_entry = relationship("KnowledgeEntry", foreign_keys=[from_entry_id], back_populates="relations_from")
    to_entry = relationship("KnowledgeEntry", foreign_keys=[to_entry_id], back_populates="relations_to")


class SyncVersion(Base):
    __tablename__ = "sync_versions"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    device_id = Column(Integer, ForeignKey("devices.id"))
    version = Column(Integer)
    content_hash = Column(String(64))
    snapshot = Column(JSON)
    synced_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("KnowledgeEntry", back_populates="versions")
    device = relationship("Device", back_populates="versions")


class SyncConflict(Base):
    __tablename__ = "sync_conflicts"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    base_version = Column(Integer)
    local_version_snapshot = Column(JSON)
    remote_version_snapshot = Column(JSON)
    conflict_reason = Column(String(200))
    status = Column(String(20), default="pending")  # pending, resolved_local, resolved_remote, merged
    resolution = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    resolved_by = Column(String(50))


class Share(Base):
    __tablename__ = "shares"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    share_token = Column(String(64), unique=True, index=True)
    permission = Column(String(20), default="read")  # read, comment, edit
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    entry = relationship("KnowledgeEntry", back_populates="shares")
    owner = relationship("User", back_populates="shares")


class ReviewReminder(Base):
    __tablename__ = "review_reminders"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("knowledge_entries.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    scheduled_for = Column(DateTime)
    interval_days = Column(Integer, default=1)
    status = Column(String(20), default="pending")  # pending, reviewed, skipped
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("KnowledgeEntry", back_populates="review_reminders")


class OperationLog(Base):
    __tablename__ = "operation_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    action = Column(String(50))
    target_type = Column(String(50))
    target_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
