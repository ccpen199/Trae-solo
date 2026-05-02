from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional

from app.database import get_db
from app.routes.auth import get_current_user, create_operation_log
from app.models import User, Bill, BillConfirmation, Device
from app.schemas import (
    BillResponse, BillConfirmRequest, MonthlyStatistics
)
from app.engines import TariffModelEngine

router = APIRouter(prefix="/api/billing", tags=["计费引擎"])


@router.post("/calculate/{device_id}", response_model=BillResponse)
def calculate_device_bill(
    device_id: int,
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    existing_bill = db.query(Bill).filter(
        Bill.device_id == device_id,
        Bill.billing_month == f"{year}-{month:02d}",
        Bill.deleted_at == None
    ).first()
    
    if existing_bill:
        raise HTTPException(
            status_code=400,
            detail=f"{year}年{month}月账单已存在"
        )
    
    tariff_engine = TariffModelEngine(db)
    bill = tariff_engine.calculate_monthly_bill(device_id, year, month)
    
    if not bill:
        raise HTTPException(
            status_code=400,
            detail="无法计算账单，请确保设备有足够的能耗数据"
        )
    
    create_operation_log(
        db=db,
        user=current_user,
        module="计费引擎",
        action="计算账单",
        target_id=device.id,
        target_name=device.device_name,
        detail=f"为设备 {device.device_name} 计算 {year}年{month}月账单"
    )
    
    return bill


@router.post("/calculate-all")
def calculate_all_devices_bill(
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    devices = db.query(Device).filter(Device.deleted_at == None).all()
    
    results = []
    tariff_engine = TariffModelEngine(db)
    
    for device in devices:
        existing_bill = db.query(Bill).filter(
            Bill.device_id == device.id,
            Bill.billing_month == f"{year}-{month:02d}",
            Bill.deleted_at == None
        ).first()
        
        if existing_bill:
            results.append({
                "device_id": device.id,
                "device_name": device.device_name,
                "status": "skipped",
                "message": "账单已存在"
            })
            continue
        
        bill = tariff_engine.calculate_monthly_bill(device.id, year, month)
        
        if bill:
            results.append({
                "device_id": device.id,
                "device_name": device.device_name,
                "status": "success",
                "bill_no": bill.bill_no,
                "final_amount": bill.final_amount
            })
        else:
            results.append({
                "device_id": device.id,
                "device_name": device.device_name,
                "status": "failed",
                "message": "数据不足"
            })
    
    create_operation_log(
        db=db,
        user=current_user,
        module="计费引擎",
        action="批量计算账单",
        detail=f"批量计算 {year}年{month}月所有设备账单"
    )
    
    return {
        "period": f"{year}年{month}月",
        "total_devices": len(devices),
        "results": results
    }


@router.get("", response_model=List[BillResponse])
def get_bills(
    status: Optional[str] = Query(None, description="账单状态"),
    billing_month: Optional[str] = Query(None, description="账单月份 (YYYY-MM)"),
    device_id: Optional[int] = Query(None, description="设备ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Bill).filter(Bill.deleted_at == None)
    
    if status:
        query = query.filter(Bill.status == status)
    
    if billing_month:
        query = query.filter(Bill.billing_month == billing_month)
    
    if device_id:
        query = query.filter(Bill.device_id == device_id)
    
    bills = query.order_by(desc(Bill.created_at)).offset(skip).limit(limit).all()
    return bills


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.deleted_at == None
    ).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="账单不存在")
    
    return bill


@router.post("/{bill_id}/confirm")
def confirm_bill(
    bill_id: int,
    confirm_data: BillConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.deleted_at == None
    ).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="账单不存在")
    
    if bill.status != "draft":
        raise HTTPException(status_code=400, detail=f"账单状态为 {bill.status}，无法确认")
    
    tariff_engine = TariffModelEngine(db)
    confirmed_bill = tariff_engine.confirm_bill(
        bill_id=bill_id,
        user_id=current_user.id,
        note=confirm_data.note
    )
    
    create_operation_log(
        db=db,
        user=current_user,
        module="计费引擎",
        action="确认账单",
        target_id=bill.id,
        target_name=bill.bill_no,
        detail=f"确认账单 {bill.bill_no}"
    )
    
    return {
        "bill_id": confirmed_bill.id,
        "bill_no": confirmed_bill.bill_no,
        "status": confirmed_bill.status,
        "confirmed_at": confirmed_bill.confirmed_at.isoformat(),
        "confirmer": current_user.real_name
    }


@router.get("/statistics/monthly", response_model=MonthlyStatistics)
def get_monthly_statistics(
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tariff_engine = TariffModelEngine(db)
    statistics = tariff_engine.get_monthly_statistics(year, month)
    
    return statistics


@router.get("/tariff/config")
def get_tariff_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tariff_engine = TariffModelEngine(db)
    config = tariff_engine.get_tariff_config()
    
    return config
