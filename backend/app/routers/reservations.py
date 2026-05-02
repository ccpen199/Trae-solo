from typing import List, Optional, Dict, Any
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Case, Reservation, TimeSlot, ServiceItem, User, QueueNumber
from app.auth import get_current_user, require_role
from app.state_machine import CaseStatus, ActionType, StateMachine
from app.engines import time_slot_engine
from app.routers.cases import _transition_case_status, _log_action, _record_status_history

router = APIRouter(prefix="/reservations", tags=["预约"])


class TimeSlotResponse(BaseModel):
    id: int
    date: str
    window_number: int
    start_time: str
    end_time: str
    total_capacity: int
    used_capacity: int
    available_capacity: int
    status: str


class ReservationCreateRequest(BaseModel):
    case_id: int
    time_slot_id: int


class ReservationResponse(BaseModel):
    id: int
    reservation_number: str
    case_id: int
    case_number: str
    time_slot_id: int
    date: str
    start_time: str
    end_time: str
    window_number: int
    status: str
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/time-slots", response_model=List[Dict[str, Any]])
async def get_available_time_slots(
    service_item_id: int = Query(..., description="服务事项ID"),
    date: Optional[str] = Query(None, description="查询日期（YYYY-MM-DD）"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN", "WINDOW_STAFF", "ADMIN"])),
):
    item_query = select(ServiceItem).where(ServiceItem.id == service_item_id)
    item_result = await db.execute(item_query)
    service_item = item_result.scalar_one_or_none()

    if not service_item:
        raise HTTPException(status_code=404, detail="服务事项不存在")

    await time_slot_engine.generate_time_slots(
        db,
        service_item.id,
        service_item.window_count,
        days_ahead=14,
    )

    slots = await time_slot_engine.get_available_slots(db, service_item.id, date)
    return slots


@router.post("", response_model=ReservationResponse)
async def create_reservation(
    request: ReservationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN"])),
):
    case_query = select(Case).options(
        selectinload(Case.service_item)
    ).where(
        Case.id == request.case_id,
        Case.citizen_id == current_user.id,
    )
    case_result = await db.execute(case_query)
    case = case_result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    current_status = CaseStatus(case.status)
    if current_status != CaseStatus.RESERVATION_AVAILABLE:
        raise HTTPException(status_code=400, detail="当前状态不可预约")

    result = await time_slot_engine.reserve_slot(
        db,
        request.time_slot_id,
        case.id,
        current_user.id,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "预约失败"),
        )

    case = await _transition_case_status(
        db, case, ActionType.MAKE_RESERVATION, current_user, "预约成功"
    )

    await db.commit()

    reservation_data = result.get("reservation", {})
    return ReservationResponse(
        id=reservation_data.get("id"),
        reservation_number=reservation_data.get("reservation_number"),
        case_id=case.id,
        case_number=case.case_number,
        time_slot_id=request.time_slot_id,
        date=reservation_data.get("date"),
        start_time=reservation_data.get("start_time"),
        end_time=reservation_data.get("end_time"),
        window_number=reservation_data.get("window_number"),
        status=reservation_data.get("status"),
        check_in_time=None,
        check_out_time=None,
        created_at=datetime.utcnow(),
    )


@router.get("/my", response_model=List[ReservationResponse])
async def get_my_reservations(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN"])),
):
    query = select(Reservation).options(
        selectinload(Reservation.time_slot),
        selectinload(Reservation.case_obj),
    ).where(Reservation.citizen_id == current_user.id)

    if status:
        query = query.where(Reservation.status == status)

    query = query.order_by(Reservation.created_at.desc())
    result = await db.execute(query)
    reservations = list(result.scalars().all())

    responses = []
    for r in reservations:
        responses.append(
            ReservationResponse(
                id=r.id,
                reservation_number=r.reservation_number,
                case_id=r.case_id,
                case_number=r.case_obj.case_number if r.case_obj else "",
                time_slot_id=r.time_slot_id,
                date=r.time_slot.date if r.time_slot else "",
                start_time=r.time_slot.start_time if r.time_slot else "",
                end_time=r.time_slot.end_time if r.time_slot else "",
                window_number=r.time_slot.window_number if r.time_slot else 0,
                status=r.status,
                check_in_time=r.check_in_time,
                check_out_time=r.check_out_time,
                created_at=r.created_at,
            )
        )

    return responses


@router.post("/{reservation_id}/cancel")
async def cancel_reservation(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN"])),
):
    result = await time_slot_engine.cancel_reservation(
        db, reservation_id, current_user.id
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "取消预约失败"),
        )

    reservation_query = select(Reservation).options(
        selectinload(Reservation.case_obj)
    ).where(Reservation.id == reservation_id)
    reservation_result = await db.execute(reservation_query)
    reservation = reservation_result.scalar_one_or_none()

    if reservation and reservation.case_obj:
        case = reservation.case_obj
        if case.status == CaseStatus.RESERVED.value:
            old_status = case.status
            case.status = CaseStatus.RESERVATION_AVAILABLE.value

            await _record_status_history(
                db,
                case.id,
                old_status,
                CaseStatus.RESERVATION_AVAILABLE.value,
                current_user.id,
                current_user.role,
                "取消预约",
            )

            await _log_action(
                db,
                "CANCEL_RESERVATION",
                "取消预约",
                case.id,
                current_user.id,
                current_user.role,
                target_type="Reservation",
                target_id=reservation_id,
            )

            await db.commit()

    return {"success": True, "message": "预约已取消"}
