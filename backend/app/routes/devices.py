from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.routes.auth import get_current_user, create_operation_log
from app.models import User, Device, MeterData, DeviceStatusLog
from app.schemas import (
    DeviceCreate, DeviceResponse, MeterDataResponse, RealTimeDataResponse
)
from app.engines import IoTStreamEngine

router = APIRouter(prefix="/api/devices", tags=["设备管理"])


@router.post("", response_model=DeviceResponse)
def create_device(
    device_data: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_device = db.query(Device).filter(
        Device.device_code == device_data.device_code
    ).first()
    
    if existing_device:
        raise HTTPException(
            status_code=400,
            detail=f"设备编号 {device_data.device_code} 已存在"
        )
    
    new_device = Device(
        device_code=device_data.device_code,
        device_name=device_data.device_name,
        device_type=device_data.device_type,
        location=device_data.location,
        rated_power=device_data.rated_power,
        status="offline",
        protocol=device_data.protocol,
        ip_address=device_data.ip_address,
        description=device_data.description,
    )
    
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    
    create_operation_log(
        db=db,
        user=current_user,
        module="设备管理",
        action="创建设备",
        target_id=new_device.id,
        target_name=new_device.device_name,
        detail=f"创建设备: {new_device.device_name}"
    )
    
    return new_device


@router.get("", response_model=List[DeviceResponse])
def get_devices(
    status: Optional[str] = Query(None, description="设备状态筛选"),
    device_type: Optional[str] = Query(None, description="设备类型筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Device).filter(Device.deleted_at == None)
    
    if status:
        query = query.filter(Device.status == status)
    
    if device_type:
        query = query.filter(Device.device_type == device_type)
    
    devices = query.order_by(desc(Device.created_at)).offset(skip).limit(limit).all()
    return devices


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_data: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    existing_device = db.query(Device).filter(
        Device.device_code == device_data.device_code,
        Device.id != device_id
    ).first()
    
    if existing_device:
        raise HTTPException(
            status_code=400,
            detail=f"设备编号 {device_data.device_code} 已被其他设备使用"
        )
    
    device.device_code = device_data.device_code
    device.device_name = device_data.device_name
    device.device_type = device_data.device_type
    device.location = device_data.location
    device.rated_power = device_data.rated_power
    device.protocol = device_data.protocol
    device.ip_address = device_data.ip_address
    device.description = device_data.description
    device.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(device)
    
    create_operation_log(
        db=db,
        user=current_user,
        module="设备管理",
        action="更新设备",
        target_id=device.id,
        target_name=device.device_name,
        detail=f"更新设备信息: {device.device_name}"
    )
    
    return device


@router.put("/{device_id}/status")
def update_device_status(
    device_id: int,
    new_status: str,
    reason: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    old_status = device.status
    
    if old_status != new_status:
        status_log = DeviceStatusLog(
            device_id=device.id,
            from_status=old_status,
            to_status=new_status,
            reason=reason,
            operator_id=current_user.id,
            operator_name=current_user.real_name,
        )
        db.add(status_log)
        
        device.status = new_status
        
        if new_status == "online":
            device.last_online_at = datetime.utcnow()
        
        device.updated_at = datetime.utcnow()
        db.commit()
        
        create_operation_log(
            db=db,
            user=current_user,
            module="设备管理",
            action="设备状态变更",
            target_id=device.id,
            target_name=device.device_name,
            detail=f"设备状态从 {old_status} 变更为 {new_status}"
        )
    
    return {
        "device_id": device.id,
        "old_status": old_status,
        "new_status": device.status,
        "updated_at": device.updated_at
    }


@router.delete("/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    device.deleted_at = datetime.utcnow()
    db.commit()
    
    create_operation_log(
        db=db,
        user=current_user,
        module="设备管理",
        action="删除设备",
        target_id=device.id,
        target_name=device.device_name,
        detail=f"删除设备: {device.device_name}"
    )
    
    return {"message": "设备已删除"}


@router.get("/{device_id}/meter-data", response_model=List[MeterDataResponse])
def get_device_meter_data(
    device_id: int,
    hours: int = Query(24, ge=1, le=168, description="查询小时数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    meter_data = db.query(MeterData).filter(
        MeterData.device_id == device_id,
        MeterData.timestamp >= start_time,
        MeterData.timestamp <= end_time,
        MeterData.is_valid == True
    ).order_by(MeterData.timestamp.asc()).all()
    
    return meter_data


@router.get("/{device_id}/realtime-data", response_model=List[RealTimeDataResponse])
def get_device_realtime_data(
    device_id: int,
    limit: int = Query(60, ge=1, le=1440, description="数据点数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    iot_engine = IoTStreamEngine(db)
    realtime_data = iot_engine.get_realtime_data(device_id, limit)
    
    return realtime_data


@router.post("/{device_id}/collect")
def collect_device_data(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    iot_engine = IoTStreamEngine(db)
    meter_data = iot_engine.collect_data(device)
    
    if meter_data:
        return {
            "success": True,
            "message": "数据采集成功",
            "data": {
                "active_power": meter_data.active_power,
                "voltage": meter_data.voltage,
                "current": meter_data.current,
                "timestamp": meter_data.timestamp.isoformat()
            }
        }
    else:
        return {
            "success": False,
            "message": "数据采集失败"
        }
