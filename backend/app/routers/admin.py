from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import require_role
from app.schemas.schemas import (
    UserResponse,
    AuditLogResponse,
    SkillResponse,
    APIResponse,
)
from app.models.models import (
    User,
    UserRole,
    AuditLog,
    Skill,
    Activity,
    Attendance,
    AnomalyRecord,
)


router = APIRouter(prefix="/admin", tags=["管理员功能"])


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取所有用户列表
    
    权限：管理员
    """
    query = select(User)

    if role:
        query = query.where(User.role == role)

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.order_by(desc(User.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    users = list(result.scalars().all())

    return users


@router.put("/users/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status(
    user_id: int,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    启用/禁用用户
    
    权限：管理员
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能禁用自己",
        )

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)

    return user


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.REVIEWER))],
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    获取审计日志列表
    
    业务功能（对应需求第6点）：
    - 所有考勤轨迹、评价记录及荣誉颁发永久留痕
    - 支持政务端全量审计
    
    权限：管理员、评审员
    """
    query = select(AuditLog)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    if action:
        query = query.where(AuditLog.action.contains(action))

    if table_name:
        query = query.where(AuditLog.table_name == table_name)

    query = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit)

    result = await db.execute(query)
    logs = list(result.scalars().all())

    return logs


@router.post("/skills", response_model=SkillResponse)
async def create_skill(
    skill_data: dict,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    创建技能标签
    
    权限：管理员
    """
    from app.schemas.schemas import SkillBase
    skill = SkillBase(**skill_data)

    existing = await db.execute(
        select(Skill).where(Skill.name == skill.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="技能标签已存在",
        )

    new_skill = Skill(
        name=skill.name,
        description=skill.description,
        category=skill.category,
    )
    db.add(new_skill)
    await db.commit()
    await db.refresh(new_skill)

    return new_skill


@router.get("/skills", response_model=List[SkillResponse])
async def list_all_skills(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: Optional[str] = Query(None),
):
    """
    获取所有技能标签
    """
    query = select(Skill)

    if category:
        query = query.where(Skill.category == category)

    result = await db.execute(query)
    skills = list(result.scalars().all())

    return skills


@router.get("/statistics", response_model=dict)
async def get_system_statistics(
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.REVIEWER))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取系统统计数据
    
    权限：管理员、评审员
    """
    from sqlalchemy import func

    user_count_result = await db.execute(select(func.count(User.id)))
    user_count = user_count_result.scalar() or 0

    activity_count_result = await db.execute(select(func.count(Activity.id)))
    activity_count = activity_count_result.scalar() or 0

    attendance_count_result = await db.execute(select(func.count(Attendance.id)))
    attendance_count = attendance_count_result.scalar() or 0

    anomaly_count_result = await db.execute(
        select(func.count(AnomalyRecord.id)).where(AnomalyRecord.is_verified == False)
    )
    pending_anomaly_count = anomaly_count_result.scalar() or 0

    total_hours_result = await db.execute(
        select(func.sum(Attendance.actual_duration)).where(
            Attendance.status == "checked_out"
        )
    )
    total_service_hours = total_hours_result.scalar() or 0

    return {
        "user_count": user_count,
        "activity_count": activity_count,
        "attendance_count": attendance_count,
        "pending_anomaly_count": pending_anomaly_count,
        "total_service_hours": float(total_service_hours),
    }
