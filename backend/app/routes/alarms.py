from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from app.database import get_db
from app.routes.auth import get_current_user, create_operation_log
from app.models import User, Alarm, TodoTask, Inspection, Device, MeterData
from app.schemas import (
    AlarmResponse, TodoTaskResponse, 
    InspectionResponse, InspectionCreate, InspectionUpdate
)
from app.engines import PowerLoadEngine

router = APIRouter(prefix="/api/alarms", tags=["告警管理"])


def create_alarm(
    db: Session,
    device_id: int,
    alarm_type: str,
    title: str,
    description: str = None,
    alarm_level: str = "warning",
    trigger_reason: str = None,
    source_data_id: int = None
) -> Alarm:
    alarm = Alarm(
        device_id=device_id,
        alarm_type=alarm_type,
        alarm_level=alarm_level,
        title=title,
        description=description,
        status="active",
        triggered_at=datetime.utcnow(),
        trigger_reason=trigger_reason,
        source_data_id=source_data_id,
    )
    db.add(alarm)
    db.commit()
    db.refresh(alarm)
    
    todo_task = TodoTask(
        task_type="alarm",
        title=f"处理告警: {title}",
        description=f"告警级别: {alarm_level}, 告警类型: {alarm_type}\n{description or ''}",
        priority="high" if alarm_level in ["critical", "high"] else "medium",
        status="pending",
        related_alarm_id=alarm.id,
    )
    db.add(todo_task)
    db.commit()
    
    return alarm


def check_alarm_conditions(db: Session, meter_data: MeterData):
    device = db.query(Device).filter(Device.id == meter_data.device_id).first()
    if not device:
        return
    
    rated_power = device.rated_power or 100.0
    threshold = rated_power * 1.2
    
    if meter_data.active_power and meter_data.active_power > threshold:
        active_overload_alarm = db.query(Alarm).filter(
            Alarm.device_id == device.id,
            Alarm.alarm_type == "over_load",
            Alarm.status == "active"
        ).first()
        
        if not active_overload_alarm:
            create_alarm(
                db=db,
                device_id=device.id,
                alarm_type="over_load",
                alarm_level="high",
                title=f"设备 {device.device_name} 负荷超标",
                description=f"实时功率 {meter_data.active_power} kW 超过阈值 {threshold} kW",
                trigger_reason=f"功率超标: {meter_data.active_power} > {threshold}",
                source_data_id=meter_data.id
            )


@router.get("", response_model=List[AlarmResponse])
def get_alarms(
    status: Optional[str] = Query(None, description="告警状态"),
    alarm_level: Optional[str] = Query(None, description="告警级别"),
    alarm_type: Optional[str] = Query(None, description="告警类型"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alarm).filter(Alarm.deleted_at == None)
    
    if status:
        query = query.filter(Alarm.status == status)
    
    if alarm_level:
        query = query.filter(Alarm.alarm_level == alarm_level)
    
    if alarm_type:
        query = query.filter(Alarm.alarm_type == alarm_type)
    
    alarms = query.order_by(desc(Alarm.created_at)).offset(skip).limit(limit).all()
    return alarms


@router.get("/{alarm_id}", response_model=AlarmResponse)
def get_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alarm = db.query(Alarm).filter(
        Alarm.id == alarm_id,
        Alarm.deleted_at == None
    ).first()
    
    if not alarm:
        raise HTTPException(status_code=404, detail="告警不存在")
    
    return alarm


@router.put("/{alarm_id}/acknowledge")
def acknowledge_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alarm = db.query(Alarm).filter(
        Alarm.id == alarm_id,
        Alarm.deleted_at == None
    ).first()
    
    if not alarm:
        raise HTTPException(status_code=404, detail="告警不存在")
    
    if alarm.status != "active":
        raise HTTPException(status_code=400, detail="告警不是活跃状态")
    
    alarm.status = "acknowledged"
    alarm.acknowledged_at = datetime.utcnow()
    alarm.acknowledged_by = current_user.id
    
    db.commit()
    
    create_operation_log(
        db=db,
        user=current_user,
        module="告警管理",
        action="确认告警",
        target_id=alarm.id,
        target_name=alarm.title,
        detail=f"确认告警: {alarm.title}"
    )
    
    return {
        "alarm_id": alarm.id,
        "status": alarm.status,
        "acknowledged_at": alarm.acknowledged_at.isoformat(),
        "acknowledged_by": current_user.real_name
    }


@router.put("/{alarm_id}/resolve")
def resolve_alarm(
    alarm_id: int,
    resolve_note: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alarm = db.query(Alarm).filter(
        Alarm.id == alarm_id,
        Alarm.deleted_at == None
    ).first()
    
    if not alarm:
        raise HTTPException(status_code=404, detail="告警不存在")
    
    alarm.status = "resolved"
    alarm.resolved_at = datetime.utcnow()
    alarm.resolved_by = current_user.id
    alarm.resolve_note = resolve_note
    
    related_tasks = db.query(TodoTask).filter(
        TodoTask.related_alarm_id == alarm_id,
        TodoTask.status == "pending"
    ).all()
    
    for task in related_tasks:
        task.status = "completed"
        task.completed_at = datetime.utcnow()
    
    db.commit()
    
    create_operation_log(
        db=db,
        user=current_user,
        module="告警管理",
        action="解决告警",
        target_id=alarm.id,
        target_name=alarm.title,
        detail=f"解决告警: {alarm.title}, 备注: {resolve_note}"
    )
    
    return {
        "alarm_id": alarm.id,
        "status": alarm.status,
        "resolved_at": alarm.resolved_at.isoformat(),
        "resolved_by": current_user.real_name
    }


@router.post("/{alarm_id}/dispatch-inspection")
def dispatch_inspection(
    alarm_id: int,
    inspection_data: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alarm = db.query(Alarm).filter(
        Alarm.id == alarm_id,
        Alarm.deleted_at == None
    ).first()
    
    if not alarm:
        raise HTTPException(status_code=404, detail="告警不存在")
    
    inspection_no = f"INS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    
    inspection = Inspection(
        inspection_no=inspection_no,
        alarm_id=alarm_id,
        device_id=alarm.device_id,
        title=inspection_data.title or f"巡检单 - {alarm.title}",
        description=inspection_data.description or alarm.description,
        status="pending",
        priority=inspection_data.priority or "high",
        assigned_to=inspection_data.assigned_to,
        dispatched_at=datetime.utcnow(),
    )
    
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    
    create_operation_log(
        db=db,
        user=current_user,
        module="告警管理",
        action="派巡检单",
        target_id=inspection.id,
        target_name=inspection.title,
        detail=f"为告警 {alarm.title} 派巡检单 {inspection_no}"
    )
    
    return inspection


@router.get("/inspections/", response_model=List[InspectionResponse])
def get_inspections(
    status: Optional[str] = Query(None, description="巡检单状态"),
    assigned_to: Optional[int] = Query(None, description="分配给用户ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Inspection).filter(Inspection.deleted_at == None)
    
    if status:
        query = query.filter(Inspection.status == status)
    
    if assigned_to:
        query = query.filter(Inspection.assigned_to == assigned_to)
    
    inspections = query.order_by(desc(Inspection.created_at)).offset(skip).limit(limit).all()
    return inspections


@router.get("/inspections/{inspection_id}", response_model=InspectionResponse)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(
        Inspection.id == inspection_id,
        Inspection.deleted_at == None
    ).first()
    
    if not inspection:
        raise HTTPException(status_code=404, detail="巡检单不存在")
    
    return inspection


@router.put("/inspections/{inspection_id}", response_model=InspectionResponse)
def update_inspection(
    inspection_id: int,
    update_data: InspectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(
        Inspection.id == inspection_id,
        Inspection.deleted_at == None
    ).first()
    
    if not inspection:
        raise HTTPException(status_code=404, detail="巡检单不存在")
    
    old_status = inspection.status
    new_status = update_data.status
    
    inspection.status = new_status
    
    if new_status == "accepted" and old_status == "pending":
        inspection.accepted_at = datetime.utcnow()
    
    if new_status == "completed" and old_status != "completed":
        inspection.completed_at = datetime.utcnow()
        inspection.operator_id = current_user.id
        inspection.recovery_record = update_data.recovery_record
        inspection.result_note = update_data.result_note
        inspection.cost = update_data.cost
        
        if inspection.alarm_id:
            alarm = db.query(Alarm).filter(Alarm.id == inspection.alarm_id).first()
            if alarm and alarm.status != "resolved":
                alarm.status = "resolved"
                alarm.resolved_at = datetime.utcnow()
                alarm.resolved_by = current_user.id
                alarm.resolve_note = update_data.result_note
    
    db.commit()
    db.refresh(inspection)
    
    create_operation_log(
        db=db,
        user=current_user,
        module="告警管理",
        action="更新巡检单",
        target_id=inspection.id,
        target_name=inspection.title,
        detail=f"巡检单状态从 {old_status} 变更为 {new_status}"
    )
    
    return inspection


@router.get("/todos/", response_model=List[TodoTaskResponse])
def get_todo_tasks(
    status: Optional[str] = Query(None, description="任务状态"),
    priority: Optional[str] = Query(None, description="任务优先级"),
    assigned_to: Optional[int] = Query(None, description="分配给用户ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TodoTask).filter(TodoTask.deleted_at == None)
    
    if status:
        query = query.filter(TodoTask.status == status)
    
    if priority:
        query = query.filter(TodoTask.priority == priority)
    
    if assigned_to is not None:
        query = query.filter(TodoTask.assigned_to == assigned_to)
    else:
        query = query.filter(TodoTask.assigned_to == None)
    
    tasks = query.order_by(desc(TodoTask.created_at)).offset(skip).limit(limit).all()
    return tasks


@router.post("/device-offline")
def create_device_offline_alarm(
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
    
    active_offline_alarm = db.query(Alarm).filter(
        Alarm.device_id == device.id,
        Alarm.alarm_type == "device_offline",
        Alarm.status == "active"
    ).first()
    
    if active_offline_alarm:
        return {
            "success": False,
            "message": "设备离线告警已存在",
            "alarm_id": active_offline_alarm.id
        }
    
    alarm = create_alarm(
        db=db,
        device_id=device.id,
        alarm_type="device_offline",
        alarm_level="critical",
        title=f"设备 {device.device_name} 离线",
        description=f"设备 {device.device_name} 已离线，最后在线时间: {device.last_online_at}",
        trigger_reason="设备心跳超时"
    )
    
    create_operation_log(
        db=db,
        user=current_user,
        module="告警管理",
        action="设备离线告警",
        target_id=alarm.id,
        target_name=alarm.title,
        detail=f"设备 {device.device_name} 离线告警"
    )
    
    return {
        "success": True,
        "message": "设备离线告警已创建",
        "alarm_id": alarm.id,
        "title": alarm.title
    }
