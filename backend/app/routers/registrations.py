from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.schemas.schemas import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationReview,
    APIResponse,
)
from app.models.models import (
    User,
    UserRole,
    Registration,
    RegistrationStatus,
    Activity,
    ActivityStatus,
    Notification,
)


router = APIRouter(prefix="/registrations", tags=["报名管理"])


@router.post("", response_model=RegistrationResponse)
async def create_registration(
    registration_data: RegistrationCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.VOLUNTEER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    志愿者报名活动
    
    业务流程：
    1. 验证活动存在且处于可报名状态
    2. 检查是否已报名过
    3. 检查活动是否已满员
    4. 创建报名记录，状态为"待审核"
    5. 同步至管理端列表（通过查询实现）
    6. 发送通知给活动组织者
    
    权限：志愿者、管理员
    """
    activity_result = await db.execute(
        select(Activity).where(Activity.id == registration_data.activity_id)
    )
    activity = activity_result.scalar_one_or_none()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )

    if activity.status not in [ActivityStatus.PUBLISHED, ActivityStatus.RECRUITING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="活动当前不可报名",
        )

    existing_result = await db.execute(
        select(Registration).where(
            and_(
                Registration.volunteer_id == current_user.id,
                Registration.activity_id == registration_data.activity_id,
            )
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已报名过此活动",
        )

    if activity.current_volunteers >= activity.max_volunteers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="活动已满员",
        )

    registration = Registration(
        volunteer_id=current_user.id,
        activity_id=registration_data.activity_id,
        status=RegistrationStatus.PENDING,
        message=registration_data.message,
    )

    db.add(registration)
    await db.commit()
    await db.refresh(registration)

    notification = Notification(
        user_id=activity.organizer_id,
        title=f"新报名提醒：{activity.title}",
        message=f"志愿者 {current_user.full_name} 报名了您的活动，请及时审核。",
        notification_type="new_registration",
        related_id=registration.id,
    )
    db.add(notification)
    await db.commit()

    return registration


@router.get("", response_model=List[RegistrationResponse])
async def list_registrations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    activity_id: Optional[int] = Query(None),
    volunteer_id: Optional[int] = Query(None),
    status: Optional[RegistrationStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取报名列表
    
    权限控制：
    - 志愿者：只能查看自己的报名
    - 组织者：可以查看自己活动的报名
    - 管理员：可以查看所有报名
    - 评审员：可以查看所有报名（用于审计）
    """
    query = select(Registration)

    if current_user.role == UserRole.VOLUNTEER:
        query = query.where(Registration.volunteer_id == current_user.id)
    elif current_user.role == UserRole.ORGANIZER:
        if activity_id:
            activity_result = await db.execute(
                select(Activity).where(Activity.id == activity_id)
            )
            activity = activity_result.scalar_one_or_none()
            if activity and activity.organizer_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="您没有权限查看此活动的报名",
                )

    if activity_id:
        query = query.where(Registration.activity_id == activity_id)

    if volunteer_id:
        query = query.where(Registration.volunteer_id == volunteer_id)

    if status:
        query = query.where(Registration.status == status)

    query = query.order_by(desc(Registration.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    registrations = list(result.scalars().all())

    return registrations


@router.get("/{registration_id}", response_model=RegistrationResponse)
async def get_registration(
    registration_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取报名详情
    
    权限控制：
    - 志愿者：只能查看自己的报名
    - 组织者：可以查看自己活动的报名
    - 管理员/评审员：可以查看所有报名
    """
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )

    if current_user.role == UserRole.VOLUNTEER:
        if registration.volunteer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限查看此报名",
            )
    elif current_user.role == UserRole.ORGANIZER:
        activity_result = await db.execute(
            select(Activity).where(Activity.id == registration.activity_id)
        )
        activity = activity_result.scalar_one_or_none()
        if activity and activity.organizer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限查看此报名",
            )

    return registration


@router.put("/{registration_id}/review", response_model=RegistrationResponse)
async def review_registration(
    registration_id: int,
    review_data: RegistrationReview,
    current_user: Annotated[User, Depends(require_role(UserRole.ORGANIZER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    审核报名
    
    业务流程：
    1. 验证报名记录存在
    2. 验证当前用户有权限审核（活动组织者或管理员）
    3. 更新报名状态（通过/拒绝）
    4. 如果通过，增加活动当前志愿者人数
    5. 发送通知给志愿者
    6. 记录审核人和审核时间
    
    权限：活动组织者、管理员
    """
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )

    if registration.status != RegistrationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此报名已被审核过",
        )

    activity_result = await db.execute(
        select(Activity).where(Activity.id == registration.activity_id)
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
            detail="您没有权限审核此报名",
        )

    if review_data.status == RegistrationStatus.APPROVED:
        if activity.current_volunteers >= activity.max_volunteers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="活动已满员，无法通过审核",
            )
        activity.current_volunteers += 1

    registration.status = review_data.status
    registration.reviewed_by = current_user.id
    registration.reviewed_at = datetime.utcnow()

    status_text = "已通过" if review_data.status == RegistrationStatus.APPROVED else "已拒绝"
    notification = Notification(
        user_id=registration.volunteer_id,
        title=f"报名审核结果：{activity.title}",
        message=f"您的报名{status_text}。{'请留意后续排班通知。' if review_data.status == RegistrationStatus.APPROVED else ''}",
        notification_type="registration_review",
        related_id=registration.id,
    )
    db.add(notification)

    await db.commit()
    await db.refresh(registration)

    return registration


@router.delete("/{registration_id}", response_model=APIResponse)
async def cancel_registration(
    registration_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    取消报名
    
    业务规则：
    1. 志愿者可以取消自己的待审核或已通过的报名
    2. 已通过的报名取消后需减少活动当前人数
    3. 活动开始后不可取消
    
    权限：志愿者（自己的报名）、管理员
    """
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )

    if current_user.role != UserRole.ADMIN and registration.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限取消此报名",
        )

    if registration.status not in [RegistrationStatus.PENDING, RegistrationStatus.APPROVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此报名无法取消",
        )

    activity_result = await db.execute(
        select(Activity).where(Activity.id == registration.activity_id)
    )
    activity = activity_result.scalar_one_or_none()

    if activity and activity.start_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="活动已开始，无法取消报名",
        )

    if registration.status == RegistrationStatus.APPROVED and activity:
        activity.current_volunteers = max(0, activity.current_volunteers - 1)

    registration.status = RegistrationStatus.CANCELLED
    await db.commit()

    return APIResponse(success=True, message="报名已取消")
