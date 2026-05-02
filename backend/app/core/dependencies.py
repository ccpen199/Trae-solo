from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import User, UserRole
from sqlalchemy import select


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    获取当前登录用户
    
    异常处理：
    - 无凭证：401 未授权
    - Token 无效：401 凭证无效
    - 用户不存在：401 用户不存在
    - 用户被禁用：403 用户已被禁用
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="凭证无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[int] = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="凭证格式错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用",
        )

    return user


def require_role(*roles: UserRole):
    """
    角色权限装饰器
    
    设计原因：
    - 不同岗位有不同的操作权限，需要严格隔离
    - 志愿者、组织者、管理员、评审员的操作范围不同
    - 权限隔离确保数据安全，防止越权操作
    
    权限矩阵：
    - Volunteer: 报名活动、查看自己的排班、签到签出、查看个人荣誉
    - Organizer: 发布活动、审核报名、排班管理、查看异常、核销活动
    - Admin: 全量数据管理、用户管理、系统配置、审计查看
    - Reviewer: 荣誉审核、异常核查、数据审计
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles:
            role_names = ", ".join([r.value for r in roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要以下角色之一: {role_names}",
            )
        return current_user

    return role_checker
