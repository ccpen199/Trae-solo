from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import (
    Case, User, ActionLog, StatusHistory, ServiceItem, Evaluation
)
from app.auth import get_current_user, require_role
from app.state_machine import CaseStatus, StateMachine
from app.engines import satisfaction_index_engine

router = APIRouter(prefix="/admin", tags=["管理员"])


class CaseMonitorResponse(BaseModel):
    id: int
    case_number: str
    citizen_name: str
    service_item_name: str
    status: str
    status_text: str
    created_at: datetime
    updated_at: Optional[datetime]
    duration_hours: float
    is_stagnant: bool

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    period: str
    total_cases: int
    completed_cases: int
    pending_cases: int
    cancelled_cases: int
    completion_rate: float
    avg_processing_hours: float
    online_rate: float
    satisfaction_rate: float
    top_services: List[Dict[str, Any]]
    stagnant_cases: int


@router.get("/cases/monitor", response_model=List[CaseMonitorResponse])
async def monitor_cases(
    status: Optional[str] = None,
    show_stagnant_only: bool = Query(False, description="仅显示停滞办件"),
    stagnant_hours: int = Query(24, description="停滞判定时间（小时）"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    query = select(Case).options(
        selectinload(Case.citizen),
        selectinload(Case.service_item),
    )

    if status:
        query = query.where(Case.status == status)

    if show_stagnant_only:
        threshold_time = datetime.utcnow() - timedelta(hours=stagnant_hours)
        query = query.where(
            and_(
                Case.status.in_([
                    CaseStatus.MATERIAL_PRE_REVIEW.value,
                    CaseStatus.MATERIAL_REJECTED.value,
                    CaseStatus.RESERVED.value,
                    CaseStatus.CHECKED_IN.value,
                    CaseStatus.PROCESSING.value,
                ]),
                Case.updated_at <= threshold_time,
            )
        )

    query = query.order_by(Case.updated_at.asc())
    result = await db.execute(query)
    cases = list(result.scalars().all())

    responses = []
    for case in cases:
        duration_hours = 0.0
        if case.updated_at and case.created_at:
            duration_hours = (case.updated_at - case.created_at).total_seconds() / 3600

        threshold_time = datetime.utcnow() - timedelta(hours=stagnant_hours)
        is_stagnant = (
            case.status in [
                CaseStatus.MATERIAL_PRE_REVIEW.value,
                CaseStatus.MATERIAL_REJECTED.value,
                CaseStatus.RESERVED.value,
                CaseStatus.CHECKED_IN.value,
                CaseStatus.PROCESSING.value,
            ]
            and case.updated_at
            and case.updated_at <= threshold_time
        )

        responses.append(
            CaseMonitorResponse(
                id=case.id,
                case_number=case.case_number,
                citizen_name=case.citizen.real_name if case.citizen else "",
                service_item_name=case.service_item.item_name if case.service_item else "",
                status=case.status,
                status_text=StateMachine.get_status_description(CaseStatus(case.status)),
                created_at=case.created_at,
                updated_at=case.updated_at,
                duration_hours=round(duration_hours, 2),
                is_stagnant=is_stagnant,
            )
        )

    return responses


@router.get("/cases/{case_id}/trace")
async def get_case_trace(
    case_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "AUDITOR"])),
):
    case_query = select(Case).options(
        selectinload(Case.materials),
        selectinload(Case.audits),
        selectinload(Case.reservation),
        selectinload(Case.evaluation),
        selectinload(Case.status_histories),
        selectinload(Case.action_logs),
    ).where(Case.id == case_id)

    result = await db.execute(case_query)
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    trace_data = {
        "case": {
            "id": case.id,
            "case_number": case.case_number,
            "status": case.status,
            "status_text": StateMachine.get_status_description(CaseStatus(case.status)),
            "created_at": case.created_at,
            "updated_at": case.updated_at,
            "completed_at": case.completed_at,
        },
        "materials": [
            {
                "id": m.id,
                "material_name": m.material_name,
                "material_type": m.material_type,
                "file_name": m.file_name,
                "ocr_status": m.ocr_status,
                "ocr_confidence": m.ocr_confidence,
                "is_verified": m.is_verified,
                "created_at": m.created_at,
            }
            for m in case.materials
        ],
        "audits": [
            {
                "id": a.id,
                "audit_type": a.audit_type,
                "audit_result": a.audit_result,
                "audit_opinion": a.audit_opinion,
                "correction_suggestion": a.correction_suggestion,
                "created_at": a.created_at,
            }
            for a in case.audits
        ],
        "status_history": [
            {
                "id": h.id,
                "from_status": h.from_status,
                "to_status": h.to_status,
                "to_status_text": StateMachine.get_status_description(CaseStatus(h.to_status)),
                "operator_role": h.operator_role,
                "reason": h.reason,
                "created_at": h.created_at,
            }
            for h in sorted(case.status_histories, key=lambda x: x.created_at)
        ],
        "action_logs": [
            {
                "id": l.id,
                "action_type": l.action_type,
                "action_name": l.action_name,
                "operator_role": l.operator_role,
                "target_type": l.target_type,
                "remark": l.remark,
                "created_at": l.created_at,
            }
            for l in sorted(case.action_logs, key=lambda x: x.created_at)
        ],
    }

    if case.reservation:
        trace_data["reservation"] = {
            "id": case.reservation.id,
            "reservation_number": case.reservation.reservation_number,
            "status": case.reservation.status,
            "check_in_time": case.reservation.check_in_time,
            "check_out_time": case.reservation.check_out_time,
            "created_at": case.reservation.created_at,
        }

    if case.evaluation:
        trace_data["evaluation"] = {
            "id": case.evaluation.id,
            "overall_score": case.evaluation.overall_score,
            "attitude_score": case.evaluation.attitude_score,
            "efficiency_score": case.evaluation.efficiency_score,
            "environment_score": case.evaluation.environment_score,
            "comment": case.evaluation.comment,
            "created_at": case.evaluation.created_at,
        }

    return trace_data


@router.get("/reports/overview")
async def get_overview_report(
    period: str = Query("month", description="统计周期: day, week, month, quarter, year"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    today = date.today()

    if period == "day":
        start_date = today
        end_date = today
    elif period == "week":
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif period == "month":
        start_date = date(today.year, today.month, 1)
        if today.month == 12:
            end_date = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(today.year, today.month + 1, 1) - timedelta(days=1)
    elif period == "quarter":
        quarter = (today.month - 1) // 3 + 1
        start_month = (quarter - 1) * 3 + 1
        start_date = date(today.year, start_month, 1)
        if quarter == 4:
            end_date = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(today.year, start_month + 3, 1) - timedelta(days=1)
    elif period == "year":
        start_date = date(today.year, 1, 1)
        end_date = date(today.year, 12, 31)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    total_query = select(func.count(Case.id)).where(
        and_(
            Case.created_at >= start_date,
            Case.created_at <= end_date + timedelta(days=1),
        )
    )
    total_result = await db.execute(total_query)
    total_cases = total_result.scalar_one() or 0

    completed_query = select(func.count(Case.id)).where(
        and_(
            Case.status.in_([CaseStatus.COMPLETED.value, CaseStatus.EVALUATED.value]),
            Case.created_at >= start_date,
            Case.created_at <= end_date + timedelta(days=1),
        )
    )
    completed_result = await db.execute(completed_query)
    completed_cases = completed_result.scalar_one() or 0

    pending_query = select(func.count(Case.id)).where(
        and_(
            Case.status.not_in([
                CaseStatus.COMPLETED.value,
                CaseStatus.EVALUATED.value,
                CaseStatus.CANCELLED.value,
            ]),
            Case.created_at >= start_date,
            Case.created_at <= end_date + timedelta(days=1),
        )
    )
    pending_result = await db.execute(pending_query)
    pending_cases = pending_result.scalar_one() or 0

    cancelled_query = select(func.count(Case.id)).where(
        and_(
            Case.status == CaseStatus.CANCELLED.value,
            Case.created_at >= start_date,
            Case.created_at <= end_date + timedelta(days=1),
        )
    )
    cancelled_result = await db.execute(cancelled_query)
    cancelled_cases = cancelled_result.scalar_one() or 0

    stagnant_query = select(func.count(Case.id)).where(
        and_(
            Case.status.in_([
                CaseStatus.MATERIAL_PRE_REVIEW.value,
                CaseStatus.MATERIAL_REJECTED.value,
                CaseStatus.RESERVED.value,
                CaseStatus.CHECKED_IN.value,
                CaseStatus.PROCESSING.value,
            ]),
            Case.updated_at <= datetime.utcnow() - timedelta(hours=24),
        )
    )
    stagnant_result = await db.execute(stagnant_query)
    stagnant_cases = stagnant_result.scalar_one() or 0

    completion_rate = round(completed_cases / total_cases * 100, 2) if total_cases > 0 else 0

    sat_stats = await satisfaction_index_engine.get_evaluation_stats(
        db, start_date, end_date
    )

    service_query = (
        select(
            ServiceItem.item_name,
            func.count(Case.id).label("case_count"),
        )
        .select_from(ServiceItem)
        .join(Case, Case.service_item_id == ServiceItem.id)
        .where(
            and_(
                Case.created_at >= start_date,
                Case.created_at <= end_date + timedelta(days=1),
            )
        )
        .group_by(ServiceItem.id)
        .order_by(func.count(Case.id).desc())
        .limit(5)
    )
    service_result = await db.execute(service_query)
    top_services = [
        {"name": row.item_name, "count": row.case_count}
        for row in service_result.all()
    ]

    return ReportResponse(
        period=period,
        total_cases=total_cases,
        completed_cases=completed_cases,
        pending_cases=pending_cases,
        cancelled_cases=cancelled_cases,
        completion_rate=completion_rate,
        avg_processing_hours=0.0,
        online_rate=100.0,
        satisfaction_rate=sat_stats.get("satisfaction_rate", 0),
        top_services=top_services,
        stagnant_cases=stagnant_cases,
    )


@router.get("/logs/actions")
async def get_action_logs(
    action_type: Optional[str] = None,
    operator_role: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    query = select(ActionLog)

    if action_type:
        query = query.where(ActionLog.action_type == action_type)
    if operator_role:
        query = query.where(ActionLog.operator_role == operator_role)

    query = query.order_by(ActionLog.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    logs = list(result.scalars().all())

    return {
        "total": len(logs),
        "logs": [
            {
                "id": l.id,
                "action_type": l.action_type,
                "action_name": l.action_name,
                "case_id": l.case_id,
                "operator_role": l.operator_role,
                "target_type": l.target_type,
                "target_id": l.target_id,
                "ip_address": l.ip_address,
                "remark": l.remark,
                "created_at": l.created_at,
            }
            for l in logs
        ],
    }


@router.get("/stats/users")
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    query = select(
        User.role,
        func.count(User.id).label("count"),
    ).where(User.is_active == True).group_by(User.role)

    result = await db.execute(query)
    stats = {}
    for row in result.all():
        stats[row.role] = row.count

    return {
        "total": sum(stats.values()),
        "by_role": stats,
    }
