from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime
from sqlalchemy import String, Enum as SQLEnum, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UIDMixin


class FarmingOperation(str, Enum):
    PLANTING = "planting"
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    PESTICIDE_APPLICATION = "pesticide_application"
    WEED_CONTROL = "weed_control"
    HARVEST = "harvest"
    OTHER = "other"


class FarmingRecord(Base, TimestampMixin, UIDMixin):
    __tablename__ = "farming_records"
    
    batch_uid: Mapped[str] = mapped_column(String(36), ForeignKey("batches.uid"), nullable=False, index=True)
    
    operation_type: Mapped[FarmingOperation] = mapped_column(SQLEnum(FarmingOperation), nullable=False)
    operation_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    operator_uid: Mapped[str] = mapped_column(String(36), ForeignKey("users.uid"), nullable=False)
    operator_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    operation_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    location_description: Mapped[Optional[str]] = mapped_column(String(500))
    
    photo_urls: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    digital_timestamp: Mapped[str] = mapped_column(String(255), nullable=False)
    
    weather_info: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    equipment_used: Mapped[Optional[str]] = mapped_column(String(500))
    labor_count: Mapped[Optional[int]] = mapped_column()
    
    pesticide_name: Mapped[Optional[str]] = mapped_column(String(200))
    pesticide_dosage: Mapped[Optional[float]] = mapped_column(Float)
    pesticide_unit: Mapped[Optional[str]] = mapped_column(String(20))
    
    fertilizer_name: Mapped[Optional[str]] = mapped_column(String(200))
    fertilizer_dosage: Mapped[Optional[float]] = mapped_column(Float)
    fertilizer_unit: Mapped[Optional[str]] = mapped_column(String(20))
    
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    batch: Mapped["Batch"] = relationship("Batch", foreign_keys=[batch_uid])
    operator: Mapped["User"] = relationship("User", foreign_keys=[operator_uid])
    
    def __repr__(self) -> str:
        return f"<FarmingRecord {self.batch_uid} - {self.operation_type.value}>"
