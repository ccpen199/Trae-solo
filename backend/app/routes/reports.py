from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.routes.auth import get_current_user, create_operation_log
from app.models import (
    User, Device, MeterData, Alarm, EnergyReport,
    AuditLog, OperationLog, ProtocolLog, CalculationLog,
    TodoTask, Inspection, Bill
)
from app.schemas import (
    DashboardStats, EnergyReportResponse, AuditLogResponse,
    DeviceTimelineResponse, ComplianceCheckResponse
)
from app.engines import EnergyAuditEngine

router = APIRouter(prefix="/api/reports", tags=["审计引擎"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_devices = db.query(Device).filter(Device.deleted_at == None).count()
    online_devices = db.query(Device).filter(
        Device.status == "online",
        Device.deleted_at == None
    ).count()
    offline_devices = total_devices - online_devices
    
    active_alarms = db.query(Alarm).filter(
        Alarm.status.in_(["active", "acknowledged"]),
        Alarm.deleted_at == None
    ).count()
    
    pending_tasks = db.query(TodoTask).filter(
        TodoTask.status == "pending",
        TodoTask.deleted_at == None
    ).count()
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    today_meter_data = db.query(MeterData).filter(
        MeterData.timestamp >= today_start,
        MeterData.timestamp < today_end,
        MeterData.is_valid == True,
        MeterData.deleted_at == None
    ).all()
    
    today_energy = 0.0
    if len(today_meter_data) >= 2:
        device_data = {}
        for d in today_meter_data:
            if d.device_id not in device_data:
                device_data[d.device_id] = []
            device_data[d.device_id].append(d)
        
        for device_id, data_list in device_data.items():
            sorted_data = sorted(data_list, key=lambda x: x.timestamp)
            if sorted_data[-1].total_energy and sorted_data[0].total_energy:
                today_energy += sorted_data[-1].total_energy - sorted_data[0].total_energy
    
    if today_energy == 0:
        today_energy = sum(d.active_power or 0 for d in today_meter_data) * (5 / 60)
    
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_meter_data = db.query(MeterData).filter(
        MeterData.timestamp >= month_start,
        MeterData.is_valid == True,
        MeterData.deleted_at == None
    ).all()
    
    month_energy = 0.0
    if len(month_meter_data) >= 2:
        device_data = {}
        for d in month_meter_data:
            if d.device_id not in device_data:
                device_data[d.device_id] = []
            device_data[d.device_id].append(d)
        
        for device_id, data_list in device_data.items():
            sorted_data = sorted(data_list, key=lambda x: x.timestamp)
            if sorted_data[-1].total_energy and sorted_data[0].total_energy:
                month_energy += sorted_data[-1].total_energy - sorted_data[0].total_energy
    
    if month_energy == 0:
        month_energy = sum(d.active_power or 0 for d in month_meter_data) * (5 / 60)
    
    efficiency_score = 75.0
    recent_meter_data = db.query(MeterData).filter(
        MeterData.is_valid == True,
        MeterData.deleted_at == None
    ).order_by(desc(MeterData.timestamp)).limit(1000).all()
    
    if recent_meter_data:
        power_factors = [d.power_factor for d in recent_meter_data if d.power_factor]
        if power_factors:
            avg_pf = sum(power_factors) / len(power_factors)
            efficiency_score = min(100, avg_pf * 100) if avg_pf > 0 else 50
            
            active_alarms_count = db.query(Alarm).filter(
                Alarm.status != "resolved",
                Alarm.deleted_at == None
            ).count()
            efficiency_score = max(0, efficiency_score - active_alarms_count * 5)
    
    return DashboardStats(
        total_devices=total_devices,
        online_devices=online_devices,
        offline_devices=offline_devices,
        active_alarms=active_alarms,
        today_energy=round(today_energy, 2),
        month_energy=round(month_energy, 2),
        efficiency_score=round(efficiency_score, 2),
        pending_tasks=pending_tasks
    )


@router.post("/generate", response_model=EnergyReportResponse)
def generate_report(
    report_type: str = Query(..., description="报告类型: daily, weekly, monthly"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间"),
    title: Optional[str] = Query(None, description="报告标题"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    
    if not start_time or not end_time:
        if report_type == "daily":
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = start_time + timedelta(days=1)
        elif report_type == "weekly":
            start_time = now - timedelta(days=now.weekday())
            start_time = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = start_time + timedelta(days=7)
        elif report_type == "monthly":
            start_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end_time = datetime(now.year + 1, 1, 1)
            else:
                end_time = datetime(now.year, now.month + 1, 1)
        else:
            start_time = now - timedelta(days=7)
            end_time = now
    
    audit_engine = EnergyAuditEngine(db)
    report = audit_engine.generate_energy_report(
        report_type=report_type,
        start_time=start_time,
        end_time=end_time,
        title=title
    )
    
    create_operation_log(
        db=db,
        user=current_user,
        module="审计引擎",
        action="生成报告",
        target_id=report.id,
        target_name=report.title,
        detail=f"生成能耗报告: {report.title}"
    )
    
    return report


@router.get("", response_model=List[EnergyReportResponse])
def get_reports(
    report_type: Optional[str] = Query(None, description="报告类型"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EnergyReport).filter(EnergyReport.deleted_at == None)
    
    if report_type:
        query = query.filter(EnergyReport.report_type == report_type)
    
    if start_time:
        query = query.filter(EnergyReport.start_time >= start_time)
    
    if end_time:
        query = query.filter(EnergyReport.end_time <= end_time)
    
    reports = query.order_by(desc(EnergyReport.created_at)).offset(skip).limit(limit).all()
    return reports


@router.get("/{report_id}", response_model=EnergyReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(EnergyReport).filter(
        EnergyReport.id == report_id,
        EnergyReport.deleted_at == None
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    
    return report


@router.get("/audit/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    trace_id: Optional[str] = Query(None, description="追踪ID"),
    category: Optional[str] = Query(None, description="分类"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audit_engine = EnergyAuditEngine(db)
    result = audit_engine.get_audit_trail(
        trace_id=trace_id,
        category=category,
        start_time=start_time,
        end_time=end_time,
        limit=limit
    )
    
    return [AuditLogResponse(**log) for log in result["logs"]]


@router.get("/device-timeline/{device_id}", response_model=DeviceTimelineResponse)
def get_device_timeline(
    device_id: int,
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    audit_engine = EnergyAuditEngine(db)
    timeline = audit_engine.get_device_timeline(device_id, hours)
    
    return timeline


@router.get("/compliance-check", response_model=ComplianceCheckResponse)
def check_compliance(
    device_id: Optional[int] = Query(None, description="设备ID（不填则检查所有设备）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audit_engine = EnergyAuditEngine(db)
    result = audit_engine.check_efficiency_compliance(device_id)
    
    return result


@router.get("/operation-logs")
def get_operation_logs(
    user_id: Optional[int] = Query(None, description="用户ID"),
    module: Optional[str] = Query(None, description="模块"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(OperationLog).filter(OperationLog.deleted_at == None)
    
    if user_id:
        query = query.filter(OperationLog.user_id == user_id)
    
    if module:
        query = query.filter(OperationLog.module == module)
    
    if start_time:
        query = query.filter(OperationLog.created_at >= start_time)
    
    if end_time:
        query = query.filter(OperationLog.created_at <= end_time)
    
    logs = query.order_by(desc(OperationLog.created_at)).limit(limit).all()
    
    return [{
        "id": log.id,
        "user_id": log.user_id,
        "username": log.username,
        "module": log.module,
        "action": log.action,
        "target_id": log.target_id,
        "target_name": log.target_name,
        "detail": log.detail,
        "status": log.status,
        "created_at": log.created_at.isoformat()
    } for log in logs]
