from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime
from sqlalchemy import String, Enum as SQLEnum, DateTime, ForeignKey, Text, Integer, Boolean, Float
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UIDMixin


class CompensationType(str, Enum):
    BATCH_CREATION = "batch_creation"
    FARMING_RECORD = "farming_record"
    QUALITY_INSPECTION = "quality_inspection"
    FLOW_TRANSFER = "flow_transfer"
    RECALL = "recall"
    TAG_ACTIVATION = "tag_activation"
    NOTIFICATION = "notification"
    EXPORT = "export"
    OTHER = "other"


class CompensationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    MANUALLY_RESOLVED = "manually_resolved"


class CompensationRecord(Base, TimestampMixin, UIDMixin):
    __tablename__ = "compensation_records"
    
    compensation_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    operation_type: Mapped[CompensationType] = mapped_column(SQLEnum(CompensationType), nullable=False)
    operation_uid: Mapped[Optional[str]] = mapped_column(String(36), index=True)
    operation_description: Mapped[Optional[str]] = mapped_column(Text)
    
    batch_uid: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("batches.uid"), index=True)
    
    initiator_uid: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.uid"))
    initiator_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    original_action: Mapped[str] = mapped_column(String(200), nullable=False)
    original_parameters: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    error_stack: Mapped[Optional[str]] = mapped_column(Text)
    error_code: Mapped[Optional[str]] = mapped_column(String(50))
    
    status: Mapped[CompensationStatus] = mapped_column(
        SQLEnum(CompensationStatus), nullable=False, default=CompensationStatus.PENDING
    )
    
    compensation_strategy: Mapped[Optional[str]] = mapped_column(String(200))
    compensation_action: Mapped[Optional[str]] = mapped_column(Text)
    
    retry_count: Mapped[int] = mapped_column(default=0)
    max_retries: Mapped[int] = mapped_column(default=3)
    
    last_retry_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    next_retry_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolved_by_uid: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.uid"))
    resolved_by_name: Mapped[Optional[str]] = mapped_column(String(100))
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text)
    
    rollback_required: Mapped[bool] = mapped_column(default=False)
    rollback_completed: Mapped[bool] = mapped_column(default=False)
    rollback_action: Mapped[Optional[str]] = mapped_column(Text)
    
    success_message: Mapped[Optional[str]] = mapped_column(Text)
    
    priority: Mapped[int] = mapped_column(default=1)
    
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    batch: Mapped["Batch"] = relationship("Batch", foreign_keys=[batch_uid])
    
    def __repr__(self) -> str:
        return f"<CompensationRecord {self.compensation_code} - {self.status.value}>"
    
    def can_retry(self) -> bool:
        return (
            self.status in [CompensationStatus.PENDING, CompensationStatus.FAILED]
            and self.retry_count < self.max_retries
        )
    
    def increment_retry(self) -> None:
        self.retry_count += 1
        if self.retry_count >= self.max_retries:
            self.status = CompensationStatus.FAILED
    
    def get_backoff_seconds(self) -> int:
        return min(2 ** self.retry_count * 60, 3600)
