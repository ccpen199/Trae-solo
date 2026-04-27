from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime
from sqlalchemy import String, Enum as SQLEnum, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UIDMixin


class QualityStatus(str, Enum):
    PENDING = "pending"
    SAMPLING = "sampling"
    TESTING = "testing"
    PASSED = "passed"
    FAILED = "failed"
    REJECTED = "rejected"
    RE_INSPECTION = "re_inspection"


class QualityInspection(Base, TimestampMixin, UIDMixin):
    __tablename__ = "quality_inspections"
    
    batch_uid: Mapped[str] = mapped_column(String(36), ForeignKey("batches.uid"), nullable=False, index=True)
    
    inspection_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    inspector_uid: Mapped[str] = mapped_column(String(36), ForeignKey("users.uid"), nullable=False)
    inspector_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    lab_name: Mapped[Optional[str]] = mapped_column(String(200))
    lab_code: Mapped[Optional[str]] = mapped_column(String(50))
    
    sampling_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    testing_start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    testing_end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    sample_count: Mapped[int] = mapped_column(default=1)
    sample_location: Mapped[Optional[str]] = mapped_column(String(500))
    
    status: Mapped[QualityStatus] = mapped_column(
        SQLEnum(QualityStatus), nullable=False, default=QualityStatus.PENDING
    )
    
    pesticide_results: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    heavy_metal_results: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    overall_result: Mapped[Optional[bool]] = mapped_column()
    result_description: Mapped[Optional[str]] = mapped_column(Text)
    
    standard_reference: Mapped[Optional[str]] = mapped_column(String(200), default="GB 2763-2021")
    
    re_inspection_required: Mapped[bool] = mapped_column(default=False)
    re_inspection_count: Mapped[int] = mapped_column(default=0)
    
    report_attachment_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    batch: Mapped["Batch"] = relationship("Batch", foreign_keys=[batch_uid])
    inspector: Mapped["User"] = relationship("User", foreign_keys=[inspector_uid])
    
    def __repr__(self) -> str:
        return f"<QualityInspection {self.inspection_code} - {self.status.value}>"
    
    def get_failed_pesticides(self, thresholds: Dict[str, float]) -> List[str]:
        if not self.pesticide_results:
            return []
        
        failed = []
        for pesticide, value in self.pesticide_results.items():
            if pesticide in thresholds:
                threshold = thresholds[pesticide]
                if isinstance(value, (int, float)) and value > threshold:
                    failed.append(pesticide)
        return failed
    
    def calculate_overall_result(self, thresholds: Dict[str, float]) -> bool:
        failed_pesticides = self.get_failed_pesticides(thresholds)
        
        heavy_metal_ok = True
        if self.heavy_metal_results:
            heavy_metal_thresholds = {
                "铅": 0.3,
                "镉": 0.05,
                "砷": 0.5,
                "汞": 0.01,
            }
            for metal, value in self.heavy_metal_results.items():
                if metal in heavy_metal_thresholds:
                    threshold = heavy_metal_thresholds[metal]
                    if isinstance(value, (int, float)) and value > threshold:
                        heavy_metal_ok = False
                        break
        
        self.overall_result = len(failed_pesticides) == 0 and heavy_metal_ok
        return self.overall_result
