import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import get_db
from app.services import UserService
from app.models import User

SECRET_KEY = "scf-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
PASSWORD_SALT = "scf-salt-2024"

security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["认证"])


def get_password_hash(password: str) -> str:
    salted = password + PASSWORD_SALT
    return hashlib.sha256(salted.encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户已停用")
    return current_user


@router.post("/login")
async def login(username: str, password: str, db: Session = Depends(get_db)):
    user_service = UserService(db)
    user = user_service.get_user_by_username(username)
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role.value,
            "org_id": user.org_id
        }
    }


@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "name": current_user.name,
        "role": current_user.role.value,
        "org_id": current_user.org_id,
        "email": current_user.email,
        "phone": current_user.phone,
        "is_active": current_user.is_active
    }
