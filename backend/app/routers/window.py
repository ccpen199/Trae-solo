from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import (
    Case, Reservation, QueueNumber, User, ServiceItem
)
from app.auth import get_current_user, require_role
from app.state_machine import CaseStatus, ActionType, StateMachine
from app.routers.cases import _transition_case_status, _log_action, _record_status_history

router = APIRouter(prefix="/window", tags=["窗口服务"])


class QueueNumberResponse(BaseModel):
    id: int
    queue_code: str
    case_id: int
    case_number: str
    citizen_name: str
    service_item_name: str
    status: str
    window_number: Optional[int]
    created_at: datetime
    called_at: Optional[datetime]

    class Config:
        from_attributes = True


class CaseProcessRequest(BaseModel):
    case_id: int
    window_number: int


class CaseCompleteRequest(BaseModel):
    case_id: int
    result: str
    remark: Optional[str] = None


@router.get("/queue/waiting", response_model=List[QueueNumberResponse])
async def get_waiting_queue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["WINDOW_STAFF", "ADMIN"])),
):
    query = select(QueueNumber).options(
        selectinload(QueueNumber.case_obj),
        selectinload(QueueNumber.case_obj).selectinload(Case.citizen),
        selectinload(QueueNumber.case_obj).selectinload(Case.service_item),
    ).where(
        QueueNumber.status == "WAITING"
    ).order_by(QueueNumber.created_at.asc())

    result = await db.execute(query)
    queues = list(result.scalars().all())

    responses = []
    for q in queues:
        responses.append(
            QueueNumberResponse(
                id=q.id,
                queue_code=q.queue_code,
                case_id=q.case_id,
                case_number=q.case_obj.case_number if q.case_obj else "",
                citizen_name=q.case_obj.citizen.real_name if q.case_obj and q.case_obj.citizen else "",
                service_item_name=q.case_obj.service_item.item_name if q.case_obj and q.case_obj.service_item else "",
                status=q.status,
                window_number=q.window_number,
                created_at=q.created_at,
                called_at=q.called_at,
            )
        )

    return responses


@router.post("/check-in")
async def check_in_citizen(
    case_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["WINDOW_STAFF", "CITIZEN"])),
):
    case_query = select(Case).options(
        selectinload(Case.reservation),
        selectinload(Case.queue_number),
    ).where(Case.id == case_id)
    case_result = await db.execute(case_query)
    case = case_result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    if current_user.role == "CITIZEN" and case.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此办件")

    current_status = CaseStatus(case.status)
    if current_status != CaseStatus.RESERVED:
        raise HTTPException(status_code=400, detail="当前状态不可取号")

    if case.queue_number:
        return {
            "success": True,
            "message": "已取号",
            "queue_code": case.queue_number.queue_code,
            "queue_status": case.queue_number.status,
        }

    case = await _transition_case_status(
        db, case, ActionType.CHECK_IN, current_user, "到场取号"
    )

    if case.reservation:
        case.reservation.check_in_time = datetime.utcnow()

    today = datetime.now().strftime("%Y%m%d")
    count_query = select(QueueNumber).where(
        QueueNumber.queue_code.like(f"Q{today}%")
    )
    count_result = await db.execute(count_query)
    count = len(count_result.scalars().all())
    queue_seq = str(count + 1).zfill(4)
    queue_code = f"Q{today}{queue_seq}"

    queue = QueueNumber(
        queue_code=queue_code,
        case_id=case.id,
        reservation_id=case.reservation.id if case.reservation else None,
        window_number=case.reservation.time_slot.window_number if case.reservation and case.reservation.time_slot else None,
        status="WAITING",
    )
    db.add(queue)

    await _log_action(
        db,
        "CHECK_IN",
        "群众到场取号",
        case.id,
        current_user.id,
        current_user.role,
        target_type="QueueNumber",
        target_id=None,
        after_data={"queue_code": queue_code},
    )

    await db.commit()

    return {
        "success": True,
        "message": "取号成功",
        "queue_code": queue_code,
        "case_status": case.status,
    }


@router.post("/call")
async def call_queue_number(
    queue_id: int,
    window_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["WINDOW_STAFF"])),
):
    queue_query = select(QueueNumber).options(
        selectinload(QueueNumber.case_obj)
    ).where(QueueNumber.id == queue_id)
    queue_result = await db.execute(queue_query)
    queue = queue_result.scalar_one_or_none()

    if not queue:
        raise HTTPException(status_code=404, detail="排队号不存在")

    if queue.status != "WAITING":
        raise HTTPException(status_code=400, detail="当前排队号不可呼叫")

    queue.status = "CALLED"
    queue.called_at = datetime.utcnow()
    queue.window_number = window_number

    if queue.case_obj:
        case = queue.case_obj
        case = await _transition_case_status(
            db, case, ActionType.WINDOW_PROCESS, current_user, "窗口开始办理"
        )

    await _log_action(
        db,
        "CALL_QUEUE",
        f"呼叫排队号: {queue.queue_code}",
        queue.case_id,
        current_user.id,
        current_user.role,
        target_type="QueueNumber",
        target_id=queue.id,
        after_data={
            "queue_code": queue.queue_code,
            "window_number": window_number,
        },
    )

    await db.commit()

    return {
        "success": True,
        "message": "呼叫成功",
        "queue_code": queue.queue_code,
        "case_id": queue.case_id,
    }


@router.post("/complete")
async def complete_case(
    request: CaseCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["WINDOW_STAFF"])),
):
    case_query = select(Case).options(
        selectinload(Case.queue_number),
        selectinload(Case.reservation),
    ).where(Case.id == request.case_id)
    case_result = await db.execute(case_query)
    case = case_result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    current_status = CaseStatus(case.status)
    if current_status != CaseStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="当前状态不可办结")

    case = await _transition_case_status(
        db, case, ActionType.COMPLETE_CASE, current_user, f"办理完成: {request.result}"
    )

    case.completed_at = datetime.utcnow()
    case.remark = request.remark

    if case.queue_number:
        case.queue_number.status = "COMPLETED"
        case.queue_number.completed_at = datetime.utcnow()

    if case.reservation:
        case.reservation.check_out_time = datetime.utcnow()

    await _log_action(
        db,
        "COMPLETE_CASE",
        "办件办结",
        case.id,
        current_user.id,
        current_user.role,
        target_type="Case",
        target_id=case.id,
        after_data={
            "result": request.result,
            "remark": request.remark,
        },
    )

    await db.commit()

    return {
        "success": True,
        "message": "办结成功",
        "case_id": case.id,
        "case_number": case.case_number,
        "new_status": case.status,
    }


@router.get("/my-cases", response_model=List[Dict[str, Any]])
async def get_window_cases(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["WINDOW_STAFF"])),
):
    query = select(Case).options(
        selectinload(Case.citizen),
        selectinload(Case.service_item),
        selectinload(Case.queue_number),
    )

    if status:
        query = query.where(Case.status == status)
    else:
        query = query.where(
            Case.status.in_([
                CaseStatus.RESERVED.value,
                CaseStatus.CHECKED_IN.value,
                CaseStatus.PROCESSING.value,
            ])
        )

    query = query.order_by(Case.created_at.asc())
    result = await db.execute(query)
    cases = list(result.scalars().all())

    responses = []
    for case in cases:
        responses.append({
            "id": case.id,
            "case_number": case.case_number,
            "citizen_name": case.citizen.real_name if case.citizen else "",
            "service_item_name": case.service_item.item_name if case.service_item else "",
            "status": case.status,
            "status_text": StateMachine.get_status_description(CaseStatus(case.status)),
            "queue_code": case.queue_number.queue_code if case.queue_number else None,
            "created_at": case.created_at,
        })

    return responses
