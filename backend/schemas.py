from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProductionLineBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProductionLineCreate(ProductionLineBase):
    pass

class ProductionLine(ProductionLineBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ShiftBase(BaseModel):
    name: str
    start_time: str
    end_time: str

class ShiftCreate(ShiftBase):
    pass

class Shift(ShiftBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class DeviceBase(BaseModel):
    code: str
    name: str
    production_line_id: Optional[int] = None
    standard_cycle_time: float
    responsible_person: Optional[str] = None
    maintenance_status: Optional[str] = "正常"
    is_active: Optional[bool] = True

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    production_line_id: Optional[int] = None
    standard_cycle_time: Optional[float] = None
    responsible_person: Optional[str] = None
    maintenance_status: Optional[str] = None
    is_active: Optional[bool] = None

class Device(DeviceBase):
    id: int
    created_at: datetime
    production_line: Optional[ProductionLine] = None
    
    class Config:
        from_attributes = True

class OperationRecordBase(BaseModel):
    device_id: int
    shift_id: Optional[int] = None
    record_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = 0
    downtime_reason: Optional[str] = None
    operator: Optional[str] = None
    notes: Optional[str] = None

class OperationRecordCreate(OperationRecordBase):
    pass

class OperationRecordUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    downtime_reason: Optional[str] = None
    notes: Optional[str] = None

class OperationRecord(OperationRecordBase):
    id: int
    created_at: datetime
    device: Optional[Device] = None
    shift: Optional[Shift] = None
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    code: str
    name: str
    standard_output: Optional[float] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class WorkOrderBase(BaseModel):
    code: str
    product_id: int
    planned_quantity: int
    status: Optional[str] = "进行中"

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrder(WorkOrderBase):
    id: int
    created_at: datetime
    product: Optional[Product] = None
    
    class Config:
        from_attributes = True

class ProductionRecordBase(BaseModel):
    device_id: int
    work_order_id: Optional[int] = None
    product_id: int
    shift_id: Optional[int] = None
    production_date: Optional[datetime] = None
    total_output: int = 0
    good_quantity: int = 0
    rework_quantity: int = 0
    scrap_quantity: int = 0
    trial_production: bool = False
    operator: Optional[str] = None
    inspector: Optional[str] = None
    quality_result: Optional[str] = None
    notes: Optional[str] = None

class ProductionRecordCreate(ProductionRecordBase):
    pass

class ProductionRecord(ProductionRecordBase):
    id: int
    created_at: datetime
    device: Optional[Device] = None
    work_order: Optional[WorkOrder] = None
    product: Optional[Product] = None
    shift: Optional[Shift] = None
    
    class Config:
        from_attributes = True

class OEEData(BaseModel):
    availability: float
    performance: float
    quality: float
    oee: float
    planned_production_time: float
    run_time: float
    planned_downtime: float
    unplanned_downtime: float
    total_output: int
    good_quantity: int

class OEEByDevice(BaseModel):
    device_id: int
    device_code: str
    device_name: str
    oee_data: OEEData

class OEEByShift(BaseModel):
    shift_id: int
    shift_name: str
    oee_data: OEEData
