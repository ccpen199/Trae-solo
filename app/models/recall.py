from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime
from sqlalchemy import String, Enum as SQLEnum, DateTime, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UIDMixin


class RecallLevel(str, Enum):
    LEVEL_1 = "level_1"
    LEVEL_2 = "level_2"
    LEVEL_3 = "level_3"


class RecallStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    PARTIALLY_COMPLETED = "partially_completed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RecallRecord(Base, TimestampMixin, UIDMixin):
    __tablename__ = "recall_records"
    
    recall_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    reason_category: Mapped[Optional[str]] = mapped_column(String(100))
    
    level: Mapped[RecallLevel] = mapped_column(SQLEnum(RecallLevel), nullable=False)
    
    initiator_uid: Mapped[str] = mapped_column(String(36), ForeignKey("users.uid"), nullable=False)
    initiator_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    approval_uid: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.uid"))
    approval_name: Mapped[Optional[str]] = mapped_column(String(100))
    approval_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    status: Mapped[RecallStatus] = mapped_column(
        SQLEnum(RecallStatus), nullable=False, default=RecallStatus.DRAFT
    )
    
    affected_batch_uids: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    total_quantity: Mapped[Optional[float]] = mapped_column()
    unit: Mapped[str] = mapped_column(String(20), default="kg")
    
    recovered_quantity: Mapped[float] = mapped_column(default=0.0)
    disposed_quantity: Mapped[float] = mapped_column(default=0.0)
    
    recall_start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    recall_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    recall_completed_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    affected_nodes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    affected_products_count: Mapped[int] = mapped_column(default=0)
    affected_stores_count: Mapped[int] = mapped_column(default=0)
    affected_consumers_count: Mapped[int] = mapped_column(default=0)
    
    compensation_required: Mapped[bool] = mapped_column(default=False)
    compensation_amount: Mapped[Optional[float]] = mapped_column()
    
    report_url: Mapped[Optional[str]] = mapped_column(String(500))
    public_notice_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    initiator: Mapped["User"] = relationship("User", foreign_keys=[initiator_uid])
    
    def __repr__(self) -> str:
        return f"<RecallRecord {self.recall_code} - {self.status.value}>"
    
    def get_progress_percentage(self) -> float:
        if self.total_quantity and self.total_quantity > 0:
            return min((self.recovered_quantity / self.total_quantity) * 100, 100.0)
        return 0.0
    
    def add_affected_batch(self, batch_uid: str) -> None:
        if self.affected_batch_uids is None:
            self.affected_batch_uids = {"batches": []}
        if "batches" not in self.affected_batch_uids:
            self.affected_batch_uids["batches"] = []
        if batch_uid not in self.affected_batch_uids["batches"]:
            self.affected_batch_uids["batches"].append(batch_uid)
            self.affected_products_count = len(self.affected_batch_uids["batches"])
    
    def get_affected_batch_list(self) -> List[str]:
        if self.affected_batch_uids and "batches" in self.affected_batch_uids:
            return self.affected_batch_uids["batches"]
        return []
