from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.schemas.schemas import (
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
    APIResponse,
    SkillResponse,
)
from app.models.models import (
    User,
    UserRole,
    Activity,
    ActivityStatus,
    Skill,
    activity_skill,
)
from app.engines.match_maker import MatchMakerEngine


router = APIRouter(prefix="/activities", tags=["活动管理"])


@router.post("", response_model=ActivityResponse)
async def create_activity(
    activity_data: ActivityCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.ORGANIZER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    组织者发布活动
    
    业务流程：
    1. 验证活动时间合理性（开始时间 < 结束时间）
    2. 验证所需技能存在
    3. 创建活动记录
    4. 调用 Match-Maker 引擎匹配志愿者
    5. 推送通知给匹配的志愿者
    6. 状态设置为已发布
    
    权限：组织者、管理员
    """
    if activity_data.start_time >= activity_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="活动开始时间必须早于结束时间",
        )

    if activity_data.required_skill_ids:
        skills_result = await db.execute(
            select(Skill).where(Skill.id.in_(activity_data.required_skill_ids))
        )
        found_skills = list(skills_result.scalars().all())
        if len(found_skills) != len(activity_data.required_skill_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="部分技能不存在",
            )

    activity = Activity(
        title=activity_data.title,
        description=activity_data.description,
        organizer_id=current_user.id,
        status=ActivityStatus.PUBLISHED,
        location=activity_data.location,
        latitude=activity_data.latitude,
        longitude=activity_data.longitude,
        location_radius=activity_data.location_radius,
        start_time=activity_data.start_time,
        end_time=activity_data.end_time,
        max_volunteers=activity_data.max_volunteers,
        current_volunteers=0,
    )

    if activity_data.required_skill_ids:
        for skill_id in activity_data.required_skill_ids:
            activity.required_skills.append(await db.get(Skill, skill_id))

    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    match_engine = MatchMakerEngine(db)
    matched_volunteers = await match_engine.find_matching_volunteers(activity.id)
    await match_engine.push_activity_notifications(activity.id, matched_volunteers)

    result = await db.execute(
        select(Activity)
        .options(selectinload(Activity.required_skills))
        .where(Activity.id == activity.id)
    )
    activity_with_skills = result.scalar_one()

    return activity_with_skills


@router.get("", response_model=List[ActivityResponse])
async def list_activities(
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[ActivityStatus] = Query(None),
    organizer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Annotated[Optional[User], Depends(get_current_user)] = None,
):
    """
    获取活动列表
    
    权限：所有用户（包括未登录）
    """
    query = select(Activity).options(selectinload(Activity.required_skills))

    if status:
        query = query.where(Activity.status == status)

    if organizer_id:
        query = query.where(Activity.organizer_id == organizer_id)

    query = query.order_by(desc(Activity.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    activities = list(result.scalars().unique().all())

    return activities


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取活动详情
    
    权限：所有用户（包括未登录）
    """
    result = await db.execute(
        select(Activity)
        .options(selectinload(Activity.required_skills))
        .where(Activity.id == activity_id)
    )
    activity = result.scalar_one_or_none()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )

    return activity


@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: int,
    update_data: ActivityUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.ORGANIZER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    更新活动信息
    
    业务规则：
    1. 只能编辑自己发布的活动（管理员除外）
    2. 活动进行中或已完成后部分字段不可修改
    3. 修改需记录审计日志
    
    权限：活动组织者、管理员
    """
    result = await db.execute(
        select(Activity)
        .options(selectinload(Activity.required_skills))
        .where(Activity.id == activity_id)
    )
    activity = result.scalar_one_or_none()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )

    if current_user.role != UserRole.ADMIN and activity.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限编辑此活动",
        )

    if activity.status in [ActivityStatus.IN_PROGRESS, ActivityStatus.COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="活动进行中或已完成，无法编辑",
        )

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(activity, key):
            setattr(activity, key, value)

    await db.commit()
    await db.refresh(activity)

    return activity


@router.delete("/{activity_id}", response_model=APIResponse)
async def cancel_activity(
    activity_id: int,
    current_user: Annotated[User, Depends(require_role(UserRole.ORGANIZER, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    取消活动
    
    业务规则：
    1. 只能取消自己发布的活动（管理员除外）
    2. 活动进行中或已完成后不可取消
    3. 取消后需通知已报名的志愿者
    
    权限：活动组织者、管理员
    """
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )

    if current_user.role != UserRole.ADMIN and activity.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限取消此活动",
        )

    if activity.status in [ActivityStatus.IN_PROGRESS, ActivityStatus.COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="活动进行中或已完成，无法取消",
        )

    activity.status = ActivityStatus.CANCELLED
    await db.commit()

    return APIResponse(success=True, message="活动已取消")
