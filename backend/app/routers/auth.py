from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User, UserRole, Wallet
from app.schemas import UserCreate, UserResponse, Token, UserUpdate
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, create_audit_log
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["认证"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """
    用户注册
    """
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )

    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )

    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        email=user_data.email,
        phone=user_data.phone,
        real_name=user_data.real_name,
        role=user_data.role,
        level=1,
        is_active=True
    )
    db.add(user)
    db.flush()

    wallet = Wallet(
        user_id=user.id,
        balance=0.0,
        total_income=0.0,
        total_withdraw=0.0
    )
    db.add(wallet)

    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        user_id=user.id,
        action="user_register",
        resource="user",
        resource_id=user.id,
        details=f"用户注册: {user.username}, 角色: {user.role.value}",
        ip_address=request.client.host if request.client else None
    )

    return user


@router.post("/login", response_model=Token)
def login(
    request: Request,
    username: str,
    password: str,
    db: Session = Depends(get_db)
):
    """
    用户登录
    """
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
        )

    access_token = create_access_token(
        data={"user_id": user.id, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    create_audit_log(
        db=db,
        user_id=user.id,
        action="user_login",
        resource="user",
        resource_id=user.id,
        details=f"用户登录: {user.username}",
        ip_address=request.client.host if request.client else None
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新当前用户信息
    """
    if update_data.email:
        existing_email = db.query(User).filter(
            User.email == update_data.email,
            User.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被使用"
            )

    if update_data.email is not None:
        current_user.email = update_data.email
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    if update_data.real_name is not None:
        current_user.real_name = update_data.real_name

    db.commit()
    db.refresh(current_user)

    return current_user
