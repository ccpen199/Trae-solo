from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime
from sqlalchemy import String, Enum as SQLEnum, Float, DateTime, ForeignKey
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UIDMixin


class BatchStatus(str, Enum):
    DRAFT = "draft"
    FARMING_IN_PROGRESS = "farming_in_progress"
    HARVESTED = "harvested"
    QUALITY_PENDING = "quality_pending"
    QUALITY_PASSED = "quality_passed"
    QUALITY_FAILED = "quality_failed"
    IN_TRANSIT = "in_transit"
    IN_WAREHOUSE = "in_warehouse"
    ON_SALE = "on_sale"
    SOLD = "sold"
    RECALLED = "recalled"
    BLOCKED = "blocked"


class Batch(Base, TimestampMixin, UIDMixin):
    __tablename__ = "batches"
    
    batch_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    product_name: Mapped[str] = mapped_column(String(100), nullable=False)
    product_category: Mapped[Optional[str]] = mapped_column(String(50))
    
    farm_name: Mapped[str] = mapped_column(String(200), nullable=False)
    farm_location: Mapped[Optional[str]] = mapped_column(String(500))
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    
    farmer_uid: Mapped[str] = mapped_column(String(36), ForeignKey("users.uid"), nullable=False, index=True)
    
    planting_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    harvest_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    estimated_quantity: Mapped[Optional[float]] = mapped_column(Float)
    actual_quantity: Mapped[Optional[float]] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20), default="kg")
    
    status: Mapped[BatchStatus] = mapped_column(SQLEnum(BatchStatus), nullable=False, default=BatchStatus.DRAFT)
    
    tags_enabled: Mapped[bool] = mapped_column(default=False, nullable=False)
    tags_count: Mapped[int] = mapped_column(default=0, nullable=False)
    
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    farmer: Mapped["User"] = relationship("User", foreign_keys=[farmer_uid])
    
    def __repr__(self) -> str:
        return f"<Batch {self.batch_code} - {self.product_name} ({self.status.value})>"
