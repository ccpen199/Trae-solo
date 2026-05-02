from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.schemas.schemas import (
    ShiftResponse,
    WorkOrderResponse,
    APIResponse,
)
from app.models.models import (
    User,
    UserRole,
    Shift,
    ShiftStatus,
    Activity,
    ActivityStatus,
    WorkOrder,
    Registration,
    RegistrationStatus,
    Notification,
)
from app.engines.shift_scheduler import ShiftSchedulerEngine
import uuid


router = APIRouter(prefix="/shifts", tags=["排班管理"])


@router.post("/auto-schedule/{activity_id}", response_model=List[ShiftResponse])
async def auto_schedule_activity(
    activity_id: int,
    current_user: Annotated[User, Depends(require_role(UserRole.ORGANIZER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
    max_shifts_per_volunteer: int = Query(2, ge=1, le=10),
):
    """
    自动排班
    
    业务流程：
    1. 验证活动存在且当前用户有权限
    2. 验证活动状态（已发布、有已审核的报名）
    3. 调用 Shift-Scheduler 排班引擎自动生成排班
    4. 生成电子派工单
    5. 发送通知给志愿者确认排班
    6. 状态更新为"已排班"
    
    权限：活动组织者、管理员
    """
    activity_result = await db.execute(
        select(Activity).where(Activity.id == activity_id)
    )
    activity = activity_result.scalar_one_or_none()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )

    if current_user.role != UserRole.ADMIN and activity.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限排班此活动",
        )

    approved_registrations = await db.execute(
        select(Registration).where(
            and_(
                Registration.activity_id == activity_id,
                Registration.status == RegistrationStatus.APPROVED,
            )
        )
    )
    if not list(approved_registrations.scalars().all()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="没有已审核通过的报名，无法排班",
        )

    scheduler = ShiftSchedulerEngine(db)
    shifts = await scheduler.auto_schedule(
        activity_id=activity_id,
        max_shifts_per_volunteer=max_shifts_per_volunteer,
    )

    activity.status = ActivityStatus.SCHEDULED

    for shift in shifts:
        order_code = f"WO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        work_order = WorkOrder(
            shift_id=shift.id,
            activity_id=activity_id,
            volunteer_id=shift.volunteer_id,
            order_code=order_code,
            tasks=f"请于 {shift.start_time.strftime('%Y-%m-%d %H:%M')} 至 {shift.end_time.strftime('%H:%M')} 前往 {activity.location} 参与志愿服务。",
        )
        db.add(work_order)

        notification = Notification(
            user_id=shift.volunteer_id,
            title=f"排班通知：{activity.title}",
            message=f"您已被安排参与 {activity.title}，时间：{shift.start_time.strftime('%Y-%m-%d %H:%M')} 至 {shift.end_time.strftime('%H:%M')}。请确认您的排班计划。",
            notification_type="shift_assigned",
            related_id=shift.id,
        )
        db.add(notification)

    await db.commit()

    return shifts


@router.get("", response_model=List[ShiftResponse])
async def list_shifts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    activity_id: Optional[int] = Query(None),
    volunteer_id: Optional[int] = Query(None),
    status: Optional[ShiftStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取排班列表
    
    权限控制：
    - 志愿者：只能查看自己的排班
    - 组织者：可以查看自己活动的排班
    - 管理员/评审员：可以查看所有排班
    """
    query = select(Shift)

    if current_user.role == UserRole.VOLUNTEER:
        query = query.where(Shift.volunteer_id == current_user.id)
    elif current_user.role == UserRole.ORGANIZER:
        if activity_id:
            activity_result = await db.execute(
                select(Activity).where(Activity.id == activity_id)
            )
            activity = activity_result.scalar_one_or_none()
            if activity and activity.organizer_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="您没有权限查看此活动的排班",
                )

    if activity_id:
        query = query.where(Shift.activity_id == activity_id)

    if volunteer_id:
        query = query.where(Shift.volunteer_id == volunteer_id)

    if status:
        query = query.where(Shift.status == status)

    query = query.order_by(desc(Shift.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    shifts = list(result.scalars().all())

    return shifts


@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取排班详情
    """
    result = await db.execute(select(Shift).where(Shift.id == shift_id))
    shift = result.scalar_one_or_none()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班不存在",
        )

    if current_user.role == UserRole.VOLUNTEER:
        if shift.volunteer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限查看此排班",
            )
    elif current_user.role == UserRole.ORGANIZER:
        activity_result = await db.execute(
            select(Activity).where(Activity.id == shift.activity_id)
        )
        activity = activity_result.scalar_one_or_none()
        if activity and activity.organizer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限查看此排班",
            )

    return shift


@router.get("/{shift_id}/work-order", response_model=WorkOrderResponse)
async def get_work_order(
    shift_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取电子派工单
    
    派工单包含：
    - 派工单编号
    - 活动信息
    - 排班时间
    - 任务说明
    """
    result = await db.execute(select(WorkOrder).where(WorkOrder.shift_id == shift_id))
    work_order = result.scalar_one_or_none()

    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="派工单不存在",
        )

    if current_user.role == UserRole.VOLUNTEER:
        if work_order.volunteer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限查看此派工单",
            )

    return work_order


@router.post("/{shift_id}/confirm", response_model=ShiftResponse)
async def confirm_shift(
    shift_id: int,
    current_user: Annotated[User, Depends(require_role(UserRole.VOLUNTEER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    志愿者确认排班
    
    业务流程：
    1. 验证排班存在且属于当前志愿者
    2. 验证排班状态为待确认
    3. 调用排班引擎确认排班
    4. 状态更新为"已确认"
    5. 发送通知给组织者
    
    权限：志愿者（自己的排班）、管理员
    """
    result = await db.execute(select(Shift).where(Shift.id == shift_id))
    shift = result.scalar_one_or_none()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班不存在",
        )

    if current_user.role != UserRole.ADMIN and shift.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限确认此排班",
        )

    if shift.status != ShiftStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此排班无法确认",
        )

    scheduler = ShiftSchedulerEngine(db)
    shift = await scheduler.confirm_shift(shift_id, current_user.id)

    activity_result = await db.execute(
        select(Activity).where(Activity.id == shift.activity_id)
    )
    activity = activity_result.scalar_one_or_none()

    if activity:
        notification = Notification(
            user_id=activity.organizer_id,
            title=f"排班确认：{activity.title}",
            message=f"志愿者 {current_user.full_name} 已确认排班，状态更新为待执行。",
            notification_type="shift_confirmed",
            related_id=shift.id,
        )
        db.add(notification)
        await db.commit()

    return shift
