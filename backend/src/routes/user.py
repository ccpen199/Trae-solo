from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional, List

from ..config.database import get_db
from ..utils import success_response, error_response, get_current_active_user
from ..models import User, RedPacket, Coupon, HousingFund, CreditCard, Bill

router = APIRouter(prefix="/user", tags=["用户"])


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = None
    avatar: Optional[str] = None


class QueryHousingFundRequest(BaseModel):
    city: str
    account_number: str


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_active_user)
):
    return success_response({
        "id": current_user.id,
        "username": current_user.username,
        "phone": current_user.phone,
        "email": current_user.email,
        "nickname": current_user.nickname,
        "avatar": current_user.avatar,
        "real_name_verified": current_user.real_name_verified,
        "bank_account_opened": current_user.bank_account_opened,
        "growth_value": current_user.growth_value,
        "level": current_user.level,
        "balance": current_user.balance,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    })


@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if request.nickname:
            current_user.nickname = request.nickname
        if request.avatar:
            current_user.avatar = request.avatar
        
        current_user.updated_at = datetime.utcnow()
        await db.commit()
        
        return success_response({
            "nickname": current_user.nickname,
            "avatar": current_user.avatar
        }, "资料更新成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"更新失败: {str(e)}")


@router.get("/red-packets")
async def get_red_packets(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(RedPacket).where(RedPacket.user_id == current_user.id)
        
        if status:
            query = query.where(RedPacket.status == status)
        
        query = query.order_by(RedPacket.created_at.desc())
        
        result = await db.execute(query)
        packets = result.scalars().all()
        
        return success_response([{
            "id": p.id,
            "name": p.name,
            "amount": p.amount,
            "min_use_amount": p.min_use_amount,
            "status": p.status,
            "valid_from": p.valid_from.isoformat(),
            "valid_to": p.valid_to.isoformat() if p.valid_to else None,
            "used_at": p.used_at.isoformat() if p.used_at else None
        } for p in packets])
    
    except Exception as e:
        return error_response(f"获取红包列表失败: {str(e)}")


@router.get("/coupons")
async def get_coupons(
    type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Coupon).where(Coupon.user_id == current_user.id)
        
        if type:
            query = query.where(Coupon.type == type)
        if status:
            query = query.where(Coupon.status == status)
        
        query = query.order_by(Coupon.created_at.desc())
        
        result = await db.execute(query)
        coupons = result.scalars().all()
        
        return success_response([{
            "id": c.id,
            "type": c.type,
            "name": c.name,
            "value": c.value,
            "min_use_amount": c.min_use_amount,
            "status": c.status,
            "valid_from": c.valid_from.isoformat(),
            "valid_to": c.valid_to.isoformat() if c.valid_to else None,
            "used_at": c.used_at.isoformat() if c.used_at else None
        } for c in coupons])
    
    except Exception as e:
        return error_response(f"获取优惠券列表失败: {str(e)}")


@router.get("/housing-fund")
async def get_housing_fund(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(HousingFund).where(HousingFund.user_id == current_user.id)
        )
        housing_fund = result.scalar_one_or_none()
        
        if not housing_fund:
            return success_response(None, "未查询到公积金信息")
        
        return success_response({
            "city": housing_fund.city,
            "account_number": housing_fund.account_number,
            "balance": housing_fund.balance,
            "monthly_payment": housing_fund.monthly_payment,
            "last_updated": housing_fund.last_updated.isoformat() if housing_fund.last_updated else None
        })
    
    except Exception as e:
        return error_response(f"获取公积金信息失败: {str(e)}")


@router.post("/housing-fund/query")
async def query_housing_fund(
    request: QueryHousingFundRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(HousingFund).where(HousingFund.user_id == current_user.id)
        )
        housing_fund = result.scalar_one_or_none()
        
        if housing_fund:
            housing_fund.city = request.city
            housing_fund.account_number = request.account_number
            housing_fund.balance = 50000.0
            housing_fund.monthly_payment = 2000.0
            housing_fund.last_updated = datetime.utcnow()
        else:
            housing_fund = HousingFund(
                user_id=current_user.id,
                city=request.city,
                account_number=request.account_number,
                balance=50000.0,
                monthly_payment=2000.0
            )
            db.add(housing_fund)
        
        current_user.growth_value += 50
        await db.commit()
        
        return success_response({
            "city": housing_fund.city,
            "account_number": housing_fund.account_number,
            "balance": housing_fund.balance,
            "monthly_payment": housing_fund.monthly_payment,
            "last_updated": housing_fund.last_updated.isoformat()
        }, "公积金查询成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"公积金查询失败: {str(e)}")


@router.get("/credit-cards")
async def get_user_credit_cards(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(CreditCard).where(
                CreditCard.user_id == current_user.id,
                CreditCard.is_active == True
            )
        )
        cards = result.scalars().all()
        
        return success_response([{
            "id": card.id,
            "bank_name": card.bank_name,
            "card_number": card.card_number,
            "card_name": card.card_name,
            "credit_limit": card.credit_limit,
            "used_limit": card.used_limit,
            "available_limit": card.available_limit,
            "current_bill": card.current_bill
        } for card in cards])
    
    except Exception as e:
        return error_response(f"获取信用卡列表失败: {str(e)}")


@router.get("/overview")
async def get_user_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(CreditCard).where(
                CreditCard.user_id == current_user.id,
                CreditCard.is_active == True
            )
        )
        cards = result.scalars().all()
        
        result = await db.execute(
            select(Bill).where(
                Bill.user_id == current_user.id,
                Bill.is_paid == False
            )
        )
        unpaid_bills = result.scalars().all()
        
        result = await db.execute(
            select(RedPacket).where(
                RedPacket.user_id == current_user.id,
                RedPacket.status == "unused"
            )
        )
        red_packets = result.scalars().all()
        
        result = await db.execute(
            select(Coupon).where(
                Coupon.user_id == current_user.id,
                Coupon.status == "unused"
            )
        )
        coupons = result.scalars().all()
        
        return success_response({
            "total_credit_limit": sum(card.credit_limit for card in cards),
            "total_used_limit": sum(card.used_limit for card in cards),
            "total_bill": sum(card.current_bill for card in cards),
            "unpaid_bill_count": len(unpaid_bills),
            "red_packet_count": len(red_packets),
            "coupon_count": len(coupons),
            "growth_value": current_user.growth_value,
            "level": current_user.level
        })
    
    except Exception as e:
        return error_response(f"获取概览失败: {str(e)}")
