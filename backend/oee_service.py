from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from models import Device, OperationRecord, ProductionRecord, Shift
from schemas import OEEData

def calculate_oee(db: Session, start_date: datetime, end_date: datetime, device_id: int = None, shift_id: int = None) -> OEEData:
    device_query = db.query(Device).filter(Device.is_active == True)
    if device_id:
        device_query = device_query.filter(Device.id == device_id)
    devices = device_query.all()
    
    if not devices:
        return OEEData(
            availability=0,
            performance=0,
            quality=0,
            oee=0,
            planned_production_time=0,
            run_time=0,
            planned_downtime=0,
            unplanned_downtime=0,
            total_output=0,
            good_quantity=0
        )
    
    record_query = db.query(OperationRecord).filter(
        and_(
            OperationRecord.start_time >= start_date,
            OperationRecord.start_time <= end_date
        )
    )
    if device_id:
        record_query = record_query.filter(OperationRecord.device_id == device_id)
    if shift_id:
        record_query = record_query.filter(OperationRecord.shift_id == shift_id)
    records = record_query.all()
    
    production_query = db.query(ProductionRecord).filter(
        and_(
            ProductionRecord.production_date >= start_date,
            ProductionRecord.production_date <= end_date
        )
    )
    if device_id:
        production_query = production_query.filter(ProductionRecord.device_id == device_id)
    if shift_id:
        production_query = production_query.filter(ProductionRecord.shift_id == shift_id)
    productions = production_query.all()
    
    total_standard_cycle_time = sum(d.standard_cycle_time for d in devices) / len(devices) if devices else 0
    
    planned_production_time = (end_date - start_date).total_seconds() / 60
    
    run_time = 0
    planned_downtime = 0
    unplanned_downtime = 0
    
    for record in records:
        duration = record.duration_minutes or 0
        if record.record_type == "运行":
            run_time += duration
        elif record.record_type in ["计划停机", "保养"]:
            planned_downtime += duration
        else:
            unplanned_downtime += duration
    
    if planned_production_time > 0:
        availability = (planned_production_time - unplanned_downtime) / planned_production_time * 100
    else:
        availability = 0
    
    total_output = sum(p.total_output for p in productions)
    good_quantity = sum(p.good_quantity for p in productions)
    
    if run_time > 0 and total_standard_cycle_time > 0:
        theoretical_output = (run_time * 60) / total_standard_cycle_time
        if theoretical_output > 0:
            performance = (total_output / theoretical_output) * 100
        else:
            performance = 0
    else:
        performance = 0
    
    if total_output > 0:
        quality = (good_quantity / total_output) * 100
    else:
        quality = 0
    
    oee = (availability / 100) * (performance / 100) * (quality / 100) * 100
    
    return OEEData(
        availability=round(availability, 2),
        performance=round(performance, 2),
        quality=round(quality, 2),
        oee=round(oee, 2),
        planned_production_time=round(planned_production_time, 2),
        run_time=round(run_time, 2),
        planned_downtime=round(planned_downtime, 2),
        unplanned_downtime=round(unplanned_downtime, 2),
        total_output=total_output,
        good_quantity=good_quantity
    )

def get_downtime_events(db: Session, start_date: datetime, end_date: datetime, device_id: int = None):
    query = db.query(OperationRecord).filter(
        and_(
            OperationRecord.start_time >= start_date,
            OperationRecord.start_time <= end_date,
            OperationRecord.record_type != "运行"
        )
    )
    if device_id:
        query = query.filter(OperationRecord.device_id == device_id)
    return query.order_by(OperationRecord.start_time.desc()).all()
