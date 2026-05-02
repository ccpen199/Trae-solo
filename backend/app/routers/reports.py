from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from app import get_db
from app.models import User
from app.services import ReportService
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/reports", tags=["报表"])


@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    report_service = ReportService(db)
    stats = report_service.get_dashboard_stats(current_user)
    
    return {
        "success": True,
        "data": stats
    }


@router.get("/orders")
async def get_order_processing_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    report_service = ReportService(db)
    
    start = None
    end = None
    
    if start_date:
        start = date.fromisoformat(start_date)
    if end_date:
        end = date.fromisoformat(end_date)
    
    report = report_service.get_order_processing_report(
        current_user, start, end
    )
    
    return {
        "success": True,
        "data": report
    }


@router.get("/risk")
async def get_risk_report(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    report_service = ReportService(db)
    report = report_service.get_risk_report(current_user)
    
    return {
        "success": True,
        "data": report
    }


@router.get("/audit-trail")
async def get_audit_trail(
    order_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    report_service = ReportService(db)
    logs = report_service.get_audit_trail(order_id, user_id, limit)
    
    return {
        "success": True,
        "data": logs,
        "total": len(logs)
    }


@router.get("/ledger")
async def get_ledger_report(
    order_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    report_service = ReportService(db)
    report = report_service.get_ledger_report(order_id, limit)
    
    return {
        "success": True,
        "data": report
    }
