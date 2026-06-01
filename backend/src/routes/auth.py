from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import random
from typing import Optional

from ..config import settings
from ..config.database import get_db
from ..utils import (
    success_response,
    error_response,
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user
)
from ..models import User, SmsCode

router = APIRouter(prefix="/auth", tags=["认证"])


class LoginRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    sms_code: Optional[str] = None
    login_type: str = Field(..., description="password, sms, qq, wechat, weibo")


class RegisterRequest(BaseModel):
    username: str
    password: str
    phone: str
    sms_code: str


class BindPhoneRequest(BaseModel):
    phone: str
    sms_code: str


class SmsCodeRequest(BaseModel):
    phone: str
    type: str = Field(default="login", description="login, register, bind, bill_update")


class ThirdPartyLoginRequest(BaseModel):
    platform: str
    openid: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None


@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = None
        
        if request.login_type == "password":
            if not request.username or not request.password:
                return error_response("用户名和密码不能为空")
            
            result = await db.execute(
                select(User).where(
                    (User.username == request.username) | (User.phone == request.username)
                )
            )
            user = result.scalar_one_or_none()
            
            if not user or not user.password_hash or not verify_password(request.password, user.password_hash):
                return error_response("用户名或密码错误")
        
        elif request.login_type == "sms":
            if not request.phone or not request.sms_code:
                return error_response("手机号和验证码不能为空")
            
            result = await db.execute(
                select(SmsCode).where(
                    SmsCode.phone == request.phone,
                    SmsCode.code == request.sms_code,
                    SmsCode.type == "login",
                    SmsCode.used == False,
                    SmsCode.expires_at > datetime.utcnow()
                )
            )
            sms_code = result.scalar_one_or_none()
            
            if not sms_code:
                return error_response("验证码错误或已过期")
            
            result = await db.execute(select(User).where(User.phone == request.phone))
            user = result.scalar_one_or_none()
            
            if not user:
                user = User(
                    phone=request.phone,
                    phone_verified=True,
                    nickname=f"用户{request.phone[-4:]}"
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            
            sms_code.used = True
            await db.commit()
        
        elif request.login_type in ["qq", "wechat", "weibo"]:
            return error_response("请使用第三方登录接口")
        
        else:
            return error_response("不支持的登录类型")
        
        if not user.is_active:
            return error_response("账号已被禁用")
        
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return success_response({
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "phone": user.phone,
                "nickname": user.nickname,
                "avatar": user.avatar,
                "phone_verified": user.phone_verified,
                "real_name_verified": user.real_name_verified
            }
        }, "登录成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"登录失败: {str(e)}")


@router.post("/third-party-login")
async def third_party_login(request: ThirdPartyLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        openid_field = f"{request.platform}_openid"
        
        result = await db.execute(
            select(User).where(getattr(User, openid_field) == request.openid)
        )
        user = result.scalar_one_or_none()
        
        is_new_user = False
        if not user:
            user = User(
                **{openid_field: request.openid},
                nickname=request.nickname or f"{request.platform}用户",
                avatar=request.avatar
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            is_new_user = True
        
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return success_response({
            "access_token": access_token,
            "token_type": "bearer",
            "is_new_user": is_new_user,
            "need_bind_phone": not user.phone_verified,
            "user": {
                "id": user.id,
                "username": user.username,
                "phone": user.phone,
                "nickname": user.nickname,
                "avatar": user.avatar,
                "phone_verified": user.phone_verified
            }
        }, "登录成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"登录失败: {str(e)}")


@router.post("/bind-phone")
async def bind_phone(
    request: BindPhoneRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(SmsCode).where(
                SmsCode.phone == request.phone,
                SmsCode.code == request.sms_code,
                SmsCode.type == "bind",
                SmsCode.used == False,
                SmsCode.expires_at > datetime.utcnow()
            )
        )
        sms_code = result.scalar_one_or_none()
        
        if not sms_code:
            return error_response("验证码错误或已过期")
        
        result = await db.execute(
            select(User).where(User.phone == request.phone, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            return error_response("该手机号已被绑定")
        
        current_user.phone = request.phone
        current_user.phone_verified = True
        sms_code.used = True
        
        await db.commit()
        
        return success_response({
            "phone": request.phone,
            "phone_verified": True
        }, "手机号绑定成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"绑定失败: {str(e)}")


@router.post("/send-sms-code")
async def send_sms_code(request: SmsCodeRequest, db: AsyncSession = Depends(get_db)):
    try:
        code = str(random.randint(100000, 999999))
        
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        sms_code = SmsCode(
            phone=request.phone,
            code=code,
            type=request.type,
            expires_at=expires_at
        )
        db.add(sms_code)
        await db.commit()
        
        return success_response({
            "phone": request.phone,
            "expires_at": expires_at.isoformat()
        }, f"验证码已发送 (演示验证码: {code})")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"发送失败: {str(e)}")


@router.post("/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(SmsCode).where(
                SmsCode.phone == request.phone,
                SmsCode.code == request.sms_code,
                SmsCode.type == "register",
                SmsCode.used == False,
                SmsCode.expires_at > datetime.utcnow()
            )
        )
        sms_code = result.scalar_one_or_none()
        
        if not sms_code:
            return error_response("验证码错误或已过期")
        
        result = await db.execute(select(User).where(User.username == request.username))
        if result.scalar_one_or_none():
            return error_response("用户名已存在")
        
        result = await db.execute(select(User).where(User.phone == request.phone))
        if result.scalar_one_or_none():
            return error_response("手机号已注册")
        
        user = User(
            username=request.username,
            password_hash=get_password_hash(request.password),
            phone=request.phone,
            phone_verified=True,
            nickname=request.username
        )
        db.add(user)
        sms_code.used = True
        await db.commit()
        await db.refresh(user)
        
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return success_response({
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "phone": user.phone,
                "nickname": user.nickname
            }
        }, "注册成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"注册失败: {str(e)}")


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    return success_response({
        "id": current_user.id,
        "username": current_user.username,
        "phone": current_user.phone,
        "email": current_user.email,
        "nickname": current_user.nickname,
        "avatar": current_user.avatar,
        "phone_verified": current_user.phone_verified,
        "real_name_verified": current_user.real_name_verified,
        "bank_account_opened": current_user.bank_account_opened,
        "growth_value": current_user.growth_value,
        "level": current_user.level,
        "balance": current_user.balance
    })
