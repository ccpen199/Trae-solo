from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from database import get_db, init_db
from models import ProductionLine, Shift, Device, OperationRecord, Product, WorkOrder, ProductionRecord
from schemas import (
    ProductionLineCreate, ProductionLine as ProductionLineSchema,
    ShiftCreate, Shift as ShiftSchema,
    DeviceCreate, DeviceUpdate, Device as DeviceSchema,
    OperationRecordCreate, OperationRecordUpdate, OperationRecord as OperationRecordSchema,
    ProductCreate, Product as ProductSchema,
    WorkOrderCreate, WorkOrder as WorkOrderSchema,
    ProductionRecordCreate, ProductionRecord as ProductionRecordSchema,
    OEEData, OEEByDevice, OEEByShift
)
from oee_service import calculate_oee, get_downtime_events

app = FastAPI(title="OEE设备效率系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:48835"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/production-lines/", response_model=ProductionLineSchema)
def create_production_line(line: ProductionLineCreate, db: Session = Depends(get_db)):
    db_line = ProductionLine(name=line.name, description=line.description)
    db.add(db_line)
    db.commit()
    db.refresh(db_line)
    return db_line

@app.get("/api/production-lines/", response_model=List[ProductionLineSchema])
def get_production_lines(db: Session = Depends(get_db)):
    return db.query(ProductionLine).all()

@app.post("/api/shifts/", response_model=ShiftSchema)
def create_shift(shift: ShiftCreate, db: Session = Depends(get_db)):
    db_shift = Shift(name=shift.name, start_time=shift.start_time, end_time=shift.end_time)
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

@app.get("/api/shifts/", response_model=List[ShiftSchema])
def get_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).all()

@app.post("/api/devices/", response_model=DeviceSchema)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    existing = db.query(Device).filter(Device.code == device.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="设备编码已存在")
    db_device = Device(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@app.get("/api/devices/", response_model=List[DeviceSchema])
def get_devices(active_only: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(Device)
    if active_only is not None:
        query = query.filter(Device.is_active == active_only)
    return query.all()

@app.get("/api/devices/{device_id}", response_model=DeviceSchema)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    return device

@app.put("/api/devices/{device_id}", response_model=DeviceSchema)
def update_device(device_id: int, device_update: DeviceUpdate, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    for key, value in device_update.dict(exclude_unset=True).items():
        setattr(device, key, value)
    db.commit()
    db.refresh(device)
    return device

@app.post("/api/operation-records/", response_model=OperationRecordSchema)
def create_operation_record(record: OperationRecordCreate, db: Session = Depends(get_db)):
    db_record = OperationRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.get("/api/operation-records/", response_model=List[OperationRecordSchema])
def get_operation_records(
    device_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(OperationRecord)
    if device_id:
        query = query.filter(OperationRecord.device_id == device_id)
    if start_date:
        query = query.filter(OperationRecord.start_time >= start_date)
    if end_date:
        query = query.filter(OperationRecord.start_time <= end_date)
    return query.order_by(OperationRecord.start_time.desc()).all()

@app.put("/api/operation-records/{record_id}", response_model=OperationRecordSchema)
def update_operation_record(record_id: int, record_update: OperationRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(OperationRecord).filter(OperationRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    for key, value in record_update.dict(exclude_unset=True).items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record

@app.delete("/api/operation-records/{record_id}")
def delete_operation_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(OperationRecord).filter(OperationRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": "删除成功"}

@app.post("/api/products/", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.code == product.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="产品编码已存在")
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/api/products/", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="产品不存在")
    db.delete(product)
    db.commit()
    return {"status": "success", "message": "删除成功"}

@app.post("/api/work-orders/", response_model=WorkOrderSchema)
def create_work_order(work_order: WorkOrderCreate, db: Session = Depends(get_db)):
    existing = db.query(WorkOrder).filter(WorkOrder.code == work_order.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="工单编码已存在")
    db_work_order = WorkOrder(**work_order.dict())
    db.add(db_work_order)
    db.commit()
    db.refresh(db_work_order)
    return db_work_order

@app.get("/api/work-orders/", response_model=List[WorkOrderSchema])
def get_work_orders(db: Session = Depends(get_db)):
    return db.query(WorkOrder).all()

@app.delete("/api/work-orders/{work_order_id}")
def delete_work_order(work_order_id: int, db: Session = Depends(get_db)):
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(status_code=404, detail="工单不存在")
    db.delete(work_order)
    db.commit()
    return {"status": "success", "message": "删除成功"}

@app.post("/api/production-records/", response_model=ProductionRecordSchema)
def create_production_record(record: ProductionRecordCreate, db: Session = Depends(get_db)):
    db_record = ProductionRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.get("/api/production-records/", response_model=List[ProductionRecordSchema])
def get_production_records(
    device_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ProductionRecord)
    if device_id:
        query = query.filter(ProductionRecord.device_id == device_id)
    if start_date:
        query = query.filter(ProductionRecord.production_date >= start_date)
    if end_date:
        query = query.filter(ProductionRecord.production_date <= end_date)
    return query.order_by(ProductionRecord.production_date.desc()).all()

@app.delete("/api/production-records/{record_id}")
def delete_production_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ProductionRecord).filter(ProductionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": "删除成功"}

@app.get("/api/oee", response_model=OEEData)
def get_oee(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    device_id: Optional[int] = None,
    shift_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    return calculate_oee(db, start_date, end_date, device_id, shift_id)

@app.get("/api/oee/by-device", response_model=List[OEEByDevice])
def get_oee_by_device(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    devices = db.query(Device).filter(Device.is_active == True).all()
    result = []
    for device in devices:
        oee_data = calculate_oee(db, start_date, end_date, device.id)
        result.append(OEEByDevice(
            device_id=device.id,
            device_code=device.code,
            device_name=device.name,
            oee_data=oee_data
        ))
    return result

@app.get("/api/oee/by-shift", response_model=List[OEEByShift])
def get_oee_by_shift(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    shifts = db.query(Shift).all()
    result = []
    for shift in shifts:
        oee_data = calculate_oee(db, start_date, end_date, shift_id=shift.id)
        result.append(OEEByShift(
            shift_id=shift.id,
            shift_name=shift.name,
            oee_data=oee_data
        ))
    return result

@app.get("/api/oee/downtime-events")
def get_oee_downtime_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    device_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    return get_downtime_events(db, start_date, end_date, device_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=58835)
