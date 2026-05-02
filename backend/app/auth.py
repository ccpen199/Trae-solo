from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import get_settings
from app.database import get_db
from app.models import User

settings = get_settings()
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_password)


def get_password_hash(password: str) -> str:
    password_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id: int = int(user_id_str)
    except JWTError:
        raise credentials_exception
    except ValueError:
        raise credentials_exception

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(roles: list):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要 {roles} 角色权限",
            )
        return current_user

    return role_checker


async def init_test_users(db: AsyncSession) -> None:
    """初始化测试用户"""
    test_users = [
        {
            "username": "citizen1",
            "password": "123456",
            "real_name": "张三",
            "id_card": "110101199001011234",
            "phone": "13800138001",
            "role": "CITIZEN",
            "department": None,
        },
        {
            "username": "citizen2",
            "password": "123456",
            "real_name": "李四",
            "id_card": "110101199202024321",
            "phone": "13800138002",
            "role": "CITIZEN",
            "department": None,
        },
        {
            "username": "auditor1",
            "password": "123456",
            "real_name": "王审核",
            "id_card": "110101198505055678",
            "phone": "13800138003",
            "role": "AUDITOR",
            "department": "政务服务中心审核科",
        },
        {
            "username": "window1",
            "password": "123456",
            "real_name": "赵窗口",
            "id_card": "110101198808089012",
            "phone": "13800138004",
            "role": "WINDOW_STAFF",
            "department": "政务服务中心窗口1",
        },
        {
            "username": "admin1",
            "password": "123456",
            "real_name": "管理员",
            "id_card": "110101198001010001",
            "phone": "13800138000",
            "role": "ADMIN",
            "department": "政务服务中心管理科",
        },
    ]

    for user_data in test_users:
        query = select(User).where(User.username == user_data["username"])
        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        if not existing:
            user = User(
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                real_name=user_data["real_name"],
                id_card=user_data["id_card"],
                phone=user_data["phone"],
                role=user_data["role"],
                department=user_data["department"],
            )
            db.add(user)

    await db.commit()
