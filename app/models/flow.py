from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime
from sqlalchemy import String, Enum as SQLEnum, Float, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UIDMixin


class FlowNode(str, Enum):
    FARM = "farm"
    WAREHOUSE_1 = "warehouse_1"
    WAREHOUSE_2 = "warehouse_2"
    DISTRIBUTION_CENTER = "distribution_center"
    RETAIL_STORE = "retail_store"
    CONSUMER = "consumer"


class FlowOperation(str, Enum):
    RECEIVE = "receive"
    STORAGE = "storage"
    TRANSFER = "transfer"
    SHIP = "ship"
    DELIVER = "deliver"
    RETURN = "return"
    SALE = "sale"


class FlowRecord(Base, TimestampMixin, UIDMixin):
    __tablename__ = "flow_records"
    
    batch_uid: Mapped[str] = mapped_column(String(36), ForeignKey("batches.uid"), nullable=False, index=True)
    
    operation_type: Mapped[FlowOperation] = mapped_column(SQLEnum(FlowOperation), nullable=False)
    
    from_node: Mapped[Optional[FlowNode]] = mapped_column(SQLEnum(FlowNode), nullable=True)
    to_node: Mapped[FlowNode] = mapped_column(SQLEnum(FlowNode), nullable=False)
    
    from_node_name: Mapped[Optional[str]] = mapped_column(String(200))
    to_node_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    from_latitude: Mapped[Optional[float]] = mapped_column(Float)
    from_longitude: Mapped[Optional[float]] = mapped_column(Float)
    to_latitude: Mapped[Optional[float]] = mapped_column(Float)
    to_longitude: Mapped[Optional[float]] = mapped_column(Float)
    
    operator_uid: Mapped[str] = mapped_column(String(36), ForeignKey("users.uid"), nullable=False)
    operator_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    operation_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="kg")
    
    temperature: Mapped[Optional[float]] = mapped_column(Float)
    humidity: Mapped[Optional[float]] = mapped_column(Float)
    environment_notes: Mapped[Optional[str]] = mapped_column(Text)
    
    transport_mode: Mapped[Optional[str]] = mapped_column(String(100))
    vehicle_number: Mapped[Optional[str]] = mapped_column(String(50))
    driver_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    package_condition: Mapped[Optional[str]] = mapped_column(String(200))
    seal_intact: Mapped[Optional[bool]] = mapped_column()
    
    receiver_name: Mapped[Optional[str]] = mapped_column(String(100))
    receiver_signature: Mapped[Optional[str]] = mapped_column(String(500))
    
    photo_urls: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    digital_timestamp: Mapped[str] = mapped_column(String(255), nullable=False)
    
    scan_code: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    
    batch_number: Mapped[int] = mapped_column(Integer, default=1)
    
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    batch: Mapped["Batch"] = relationship("Batch", foreign_keys=[batch_uid])
    operator: Mapped["User"] = relationship("User", foreign_keys=[operator_uid])
    
    def __repr__(self) -> str:
        return f"<FlowRecord {self.batch_uid} - {self.operation_type.value}>"
    
    def get_transfer_summary(self) -> Dict[str, Any]:
        return {
            "from": {"node": self.from_node.value if self.from_node else None, "name": self.from_node_name},
            "to": {"node": self.to_node.value, "name": self.to_node_name},
            "quantity": self.quantity,
            "unit": self.unit,
            "operator": self.operator_name,
            "time": self.operation_time,
            "temperature": self.temperature,
            "humidity": self.humidity,
        }
