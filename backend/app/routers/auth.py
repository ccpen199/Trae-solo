from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from app.core.config import settings
from app.schemas.schemas import (
    UserCreate,
    UserResponse,
    Token,
    APIResponse,
)
from app.models.models import User


router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    用户注册
    
    业务规则：
    1. 用户名必须唯一
    2. 邮箱和手机号可选，但如果提供必须唯一
    3. 密码会被加密存储
    4. 默认角色为志愿者(volunteer)
    
    异常处理：
    - 用户名已存在：400 冲突
    - 邮箱已存在：400 冲突
    - 手机号已存在：400 冲突
    """
    existing = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在",
        )

    if user_data.email:
        existing_email = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册",
            )

    if user_data.phone:
        existing_phone = await db.execute(
            select(User).where(User.phone == user_data.phone)
        )
        if existing_phone.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="手机号已被注册",
            )

    user = User(
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        is_active=True,
        credit_score=100,
        total_service_hours=0.0,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    用户登录（OAuth2 格式）
    
    业务规则：
    1. 验证用户名和密码
    2. 返回 JWT Token 和用户信息
    3. Token 有效期由配置决定
    
    异常处理：
    - 用户不存在：401 未授权
    - 密码错误：401 未授权
    - 用户被禁用：403 禁止访问
    """
    result = await db.execute(
        select(User).where(User.username == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用",
        )

    access_token = create_access_token(
        subject={
            "user_id": user.id,
            "username": user.username,
            "role": user.role.value,
        },
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    获取当前登录用户信息
    
    权限：所有已登录用户
    """
    return current_user
