from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, UserRole
from app.auth import (
    authenticate_user, create_access_token, get_current_user,
    get_password_hash
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["认证"])
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    real_name: str
    role: str
    email: Optional[str]
    phone: Optional[str]
    department: Optional[str]
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)


@router.post("/init-data")
def init_test_data(db: Session = Depends(get_db)):
    existing = db.query(User).first()
    if existing:
        return {"message": "数据已初始化"}
    
    admin = User(
        username="admin",
        password_hash=get_password_hash("admin123"),
        real_name="系统管理员",
        role=UserRole.ADMIN,
        email="admin@example.com",
        department="系统部"
    )
    
    applicant = User(
        username="applicant",
        password_hash=get_password_hash("123456"),
        real_name="张申请人",
        role=UserRole.APPLICANT,
        email="applicant@example.com",
        department="技术部"
    )
    
    approver = User(
        username="approver",
        password_hash=get_password_hash("123456"),
        real_name="李审批人",
        role=UserRole.APPROVER,
        email="approver@example.com",
        department="审批部"
    )
    
    finance = User(
        username="finance",
        password_hash=get_password_hash("123456"),
        real_name="王财务",
        role=UserRole.FINANCE,
        email="finance@example.com",
        department="财务部"
    )
    
    db.add_all([admin, applicant, approver, finance])
    db.commit()
    
    return {"message": "测试数据初始化完成", "users": [
        {"username": "admin", "password": "admin123", "role": "管理员"},
        {"username": "applicant", "password": "123456", "role": "申请人"},
        {"username": "approver", "password": "123456", "role": "审批人"},
        {"username": "finance", "password": "123456", "role": "财务"}
    ]}
