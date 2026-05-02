from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.schemas.schemas import (
    AttendanceCreate,
    AttendanceResponse,
    IncentiveResponse,
    APIResponse,
)
from app.models.models import (
    User,
    UserRole,
    Attendance,
    AttendanceStatus,
    Shift,
    ShiftStatus,
    Activity,
    ActivityStatus,
    AnomalyRecord,
    AnomalyType,
)
from app.engines.lbs_attendance import LBSAttendanceEngine
from app.engines.badge_incentive import BadgeIncentiveEngine


router = APIRouter(prefix="/attendances", tags=["考勤管理"])


@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    check_in_data: AttendanceCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.VOLUNTEER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    志愿者签到
    
    业务流程：
    1. 验证排班存在且属于当前志愿者
    2. 调用 LBS-Attendance 定位引擎验证位置
    3. 检查签到时间是否在合理范围内
    4. 创建/更新考勤记录
    5. 检查是否存在异常（迟到、位置不匹配等）
    6. 状态更新为"已签到"
    
    权限：志愿者（自己的排班）、管理员
    """
    try:
        lbs_engine = LBSAttendanceEngine(db)
        attendance = await lbs_engine.check_in(
            shift_id=check_in_data.shift_id,
            volunteer_id=current_user.id,
            latitude=check_in_data.latitude,
            longitude=check_in_data.longitude,
        )
        return attendance
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    check_out_data: AttendanceCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.VOLUNTEER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    志愿者签出
    
    业务流程：
    1. 验证存在有效的签到记录
    2. 调用 LBS-Attendance 定位引擎验证位置
    3. 计算实际服务时长
    4. 检查是否存在异常（早退等）
    5. 更新考勤记录状态为"已签出"
    
    权限：志愿者（自己的考勤）、管理员
    """
    try:
        lbs_engine = LBSAttendanceEngine(db)
        attendance = await lbs_engine.check_out(
            shift_id=check_out_data.shift_id,
            volunteer_id=current_user.id,
            latitude=check_out_data.latitude,
            longitude=check_out_data.longitude,
        )
        return attendance
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{attendance_id}/verify", response_model=IncentiveResponse)
async def verify_attendance_and_apply_incentives(
    attendance_id: int,
    current_user: Annotated[User, Depends(require_role(UserRole.ORGANIZER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    组织者核销考勤并应用激励
    
    业务流程（对应需求第4点）：
    1. 组织者核销活动/考勤
    2. 后端"激励引擎"累加诚信分
    3. 荣誉勋章即时存入电子档案
    4. 同步至个人中心展示
    
    权限：活动组织者、管理员
    """
    result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="考勤记录不存在",
        )

    if attendance.status != AttendanceStatus.CHECKED_OUT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="考勤记录未完成签出",
        )

    activity_result = await db.execute(
        select(Activity).where(Activity.id == attendance.activity_id)
    )
    activity = activity_result.scalar_one_or_none()

    if activity and current_user.role != UserRole.ADMIN:
        if activity.organizer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限核销此考勤",
            )

    incentive_engine = BadgeIncentiveEngine(db)
    try:
        incentive_result = await incentive_engine.calculate_and_apply_incentives(attendance_id)
        return IncentiveResponse(**incentive_result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=List[AttendanceResponse])
async def list_attendances(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    activity_id: Optional[int] = Query(None),
    volunteer_id: Optional[int] = Query(None),
    status: Optional[AttendanceStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取考勤列表
    """
    query = select(Attendance)

    if current_user.role == UserRole.VOLUNTEER:
        query = query.where(Attendance.volunteer_id == current_user.id)
    elif current_user.role == UserRole.ORGANIZER:
        if activity_id:
            activity_result = await db.execute(
                select(Activity).where(Activity.id == activity_id)
            )
            activity = activity_result.scalar_one_or_none()
            if activity and activity.organizer_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="您没有权限查看此活动的考勤",
                )

    if activity_id:
        query = query.where(Attendance.activity_id == activity_id)

    if volunteer_id:
        query = query.where(Attendance.volunteer_id == volunteer_id)

    if status:
        query = query.where(Attendance.status == status)

    query = query.order_by(desc(Attendance.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    attendances = list(result.scalars().all())

    return attendances


@router.get("/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance(
    attendance_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取考勤详情
    """
    result = await db.execute(select(Attendance).where(Attendance.id == attendance_id))
    attendance = result.scalar_one_or_none()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="考勤记录不存在",
        )

    if current_user.role == UserRole.VOLUNTEER:
        if attendance.volunteer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限查看此考勤",
            )

    return attendance
