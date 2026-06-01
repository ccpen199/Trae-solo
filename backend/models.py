from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class ProductionLine(Base):
    __tablename__ = "production_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    devices = relationship("Device", back_populates="production_line")

class Shift(Base):
    __tablename__ = "shifts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    production_line_id = Column(Integer, ForeignKey("production_lines.id"))
    standard_cycle_time = Column(Float, nullable=False)
    responsible_person = Column(String(100))
    maintenance_status = Column(String(50), default="正常")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    production_line = relationship("ProductionLine", back_populates="devices")
    operation_records = relationship("OperationRecord", back_populates="device")
    production_records = relationship("ProductionRecord", back_populates="device")

class OperationRecord(Base):
    __tablename__ = "operation_records"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    record_type = Column(String(50), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration_minutes = Column(Float, default=0)
    downtime_reason = Column(String(200))
    operator = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="operation_records")
    shift = relationship("Shift")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    standard_output = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    planned_quantity = Column(Integer, nullable=False)
    status = Column(String(50), default="进行中")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product")

class ProductionRecord(Base):
    __tablename__ = "production_records"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    work_order_id = Column(Integer, ForeignKey("work_orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    production_date = Column(DateTime, default=datetime.utcnow)
    total_output = Column(Integer, default=0)
    good_quantity = Column(Integer, default=0)
    rework_quantity = Column(Integer, default=0)
    scrap_quantity = Column(Integer, default=0)
    trial_production = Column(Boolean, default=False)
    operator = Column(String(100))
    inspector = Column(String(100))
    quality_result = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="production_records")
    work_order = relationship("WorkOrder")
    product = relationship("Product")
    shift = relationship("Shift")
