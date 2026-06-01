from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User
from app.schemas import ApiResponse

router = APIRouter()

def simple_hash(password):
    return "hash_" + password + "_fixed"

def simple_verify(password, hashed):
    return simple_hash(password) == hashed

class UserRegisterRequest(BaseModel):
    username: str
    password: str
    phone: str | None = None

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    nickname: str | None = None
    phone: str | None = None
    avatar: str | None = None
    city_name: str | None = None

    class Config:
        from_attributes = True

@router.post("/register", response_model=ApiResponse[UserResponse])
async def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        return ApiResponse(code=400, message="用户名已存在")
    
    user = User(
        username=req.username,
        password_hash=simple_hash(req.password),
        phone=req.phone,
        nickname=req.username
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return ApiResponse(data=UserResponse.model_validate(user))

@router.post("/login", response_model=ApiResponse[UserResponse])
async def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not simple_verify(req.password, user.password_hash):
        return ApiResponse(code=400, message="用户名或密码错误")
    
    return ApiResponse(data=UserResponse.model_validate(user))
