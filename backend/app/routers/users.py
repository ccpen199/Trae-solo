from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.schemas.schemas import (
    UserResponse,
    BadgeResponse,
    UserBadgeResponse,
    CreditRecordResponse,
    NotificationResponse,
    AnomalyRecordResponse,
    ServiceHeatResponse,
    APIResponse,
)
from app.models.models import (
    User,
    UserRole,
    UserBadge,
    Badge,
    CreditRecord,
    Notification,
    AnomalyRecord,
    ServiceHeat,
    Activity,
    Attendance,
)


router = APIRouter(tags=["用户中心与激励"])


@router.get("/users/me/profile", response_model=UserResponse)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    获取当前用户个人信息
    
    权限：所有已登录用户
    """
    return current_user


@router.get("/users/me/badges", response_model=List[UserBadgeResponse])
async def get_my_badges(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取当前用户的荣誉勋章列表
    
    权限：所有已登录用户
    """
    result = await db.execute(
        select(UserBadge)
        .options(selectinload(UserBadge.badge))
        .where(UserBadge.user_id == current_user.id)
        .order_by(desc(UserBadge.awarded_at))
        .offset(skip)
        .limit(limit)
    )
    user_badges = list(result.scalars().unique().all())
    return user_badges


@router.get("/users/me/credit-records", response_model=List[CreditRecordResponse])
async def get_my_credit_records(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取当前用户的诚信分记录
    
    权限：所有已登录用户
    """
    result = await db.execute(
        select(CreditRecord)
        .where(CreditRecord.user_id == current_user.id)
        .order_by(desc(CreditRecord.created_at))
        .offset(skip)
        .limit(limit)
    )
    records = list(result.scalars().all())
    return records


@router.get("/users/me/notifications", response_model=List[NotificationResponse])
async def get_my_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_read: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取当前用户的通知列表
    
    权限：所有已登录用户
    """
    query = select(Notification).where(Notification.user_id == current_user.id)

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)

    query = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    notifications = list(result.scalars().all())
    return notifications


@router.post("/notifications/{notification_id}/read", response_model=APIResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    标记通知为已读
    
    权限：通知所有者
    """
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通知不存在",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限操作此通知",
        )

    notification.is_read = True
    await db.commit()

    return APIResponse(success=True, message="已标记为已读")


@router.get("/badges", response_model=List[BadgeResponse])
async def list_all_badges(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取所有可用的荣誉勋章列表
    
    权限：所有用户（包括未登录）
    """
    result = await db.execute(
        select(Badge)
        .where(Badge.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    badges = list(result.scalars().all())
    return badges


@router.get("/anomalies", response_model=List[AnomalyRecordResponse])
async def list_anomalies(
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.REVIEWER, UserRole.ORGANIZER))],
    db: Annotated[AsyncSession, Depends(get_db)],
    activity_id: Optional[int] = Query(None),
    volunteer_id: Optional[int] = Query(None),
    is_verified: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取异常记录列表
    
    权限：管理员、评审员、组织者
    """
    query = select(AnomalyRecord)

    if activity_id:
        query = query.where(AnomalyRecord.activity_id == activity_id)

    if volunteer_id:
        query = query.where(AnomalyRecord.volunteer_id == volunteer_id)

    if is_verified is not None:
        query = query.where(AnomalyRecord.is_verified == is_verified)

    query = query.order_by(desc(AnomalyRecord.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    anomalies = list(result.scalars().all())
    return anomalies


@router.put("/anomalies/{anomaly_id}/verify", response_model=AnomalyRecordResponse)
async def verify_anomaly(
    anomaly_id: int,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.REVIEWER))],
    db: Annotated[AsyncSession, Depends(get_db)],
    action_taken: str = Query(...),
):
    """
    审核异常记录
    
    业务流程：
    1. 验证异常记录存在
    2. 标记为已核实
    3. 记录处理措施
    4. 根据异常类型执行相应的惩罚（如扣除诚信分）
    
    权限：管理员、评审员
    """
    from datetime import datetime

    result = await db.execute(
        select(AnomalyRecord).where(AnomalyRecord.id == anomaly_id)
    )
    anomaly = result.scalar_one_or_none()

    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="异常记录不存在",
        )

    if anomaly.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该异常已被审核",
        )

    anomaly.is_verified = True
    anomaly.verified_by = current_user.id
    anomaly.verified_at = datetime.utcnow()
    anomaly.action_taken = action_taken

    if anomaly.volunteer_id:
        user_result = await db.execute(
            select(User).where(User.id == anomaly.volunteer_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            deduction = 10
            user.credit_score = max(0, user.credit_score - deduction)

            credit_record = CreditRecord(
                user_id=user.id,
                activity_id=anomaly.activity_id,
                change=-deduction,
                balance=user.credit_score,
                reason=f"异常处理：{anomaly.description}",
            )
            db.add(credit_record)

    await db.commit()
    await db.refresh(anomaly)

    return anomaly


@router.get("/service-heat", response_model=List[ServiceHeatResponse])
async def get_service_heat(
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.REVIEWER))],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(7, ge=1, le=30),
):
    """
    获取社区服务热度曲线数据
    
    业务功能（对应需求第5点）：
    - 后端汇总各社区服务热度曲线
    - 供管理员和评审员查看服务趋势
    
    权限：管理员、评审员
    """
    from datetime import datetime, timedelta

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    result = await db.execute(
        select(ServiceHeat)
        .where(ServiceHeat.date >= start_date)
        .order_by(ServiceHeat.date, ServiceHeat.hour)
    )
    heat_data = list(result.scalars().all())

    return heat_data
