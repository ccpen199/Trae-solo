from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional, List

from ..config.database import get_db
from ..utils import success_response, error_response, get_current_active_user
from ..models import User, CreditCard, Bill, BillDetail, SmsCode, VerificationCode

router = APIRouter(prefix="/bill", tags=["账单"])


class AddCreditCardRequest(BaseModel):
    bank_name: str
    card_number: str
    card_name: Optional[str] = None
    credit_limit: float = 0.0
    bill_day: Optional[int] = None
    repayment_day: Optional[int] = None


class UpdateBillRequest(BaseModel):
    card_id: int
    sms_code: str


class ImportBillRequest(BaseModel):
    card_id: int
    bill_month: str
    total_amount: float
    min_repayment: float
    bill_date: Optional[str] = None
    repayment_date: Optional[str] = None
    details: List[dict] = Field(default_factory=list)


class RepayRequest(BaseModel):
    bill_id: int
    amount: float
    pay_type: str = "full"


@router.get("/credit-cards")
async def get_credit_cards(
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
            "bill_day": card.bill_day,
            "repayment_day": card.repayment_day,
            "current_bill": card.current_bill,
            "min_repayment": card.min_repayment,
            "last_updated": card.last_updated.isoformat() if card.last_updated else None
        } for card in cards])
    
    except Exception as e:
        return error_response(f"获取信用卡列表失败: {str(e)}")


@router.post("/credit-cards")
async def add_credit_card(
    request: AddCreditCardRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        card = CreditCard(
            user_id=current_user.id,
            bank_name=request.bank_name,
            card_number=request.card_number,
            card_name=request.card_name,
            credit_limit=request.credit_limit,
            available_limit=request.credit_limit,
            bill_day=request.bill_day,
            repayment_day=request.repayment_day
        )
        db.add(card)
        await db.commit()
        await db.refresh(card)
        
        current_user.growth_value += 50
        await db.commit()
        
        return success_response({
            "id": card.id,
            "bank_name": card.bank_name,
            "card_number": card.card_number
        }, "信用卡添加成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"添加信用卡失败: {str(e)}")


@router.delete("/credit-cards/{card_id}")
async def delete_credit_card(
    card_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(CreditCard).where(
                CreditCard.id == card_id,
                CreditCard.user_id == current_user.id
            )
        )
        card = result.scalar_one_or_none()
        
        if not card:
            return error_response("信用卡不存在")
        
        card.is_active = False
        await db.commit()
        
        return success_response(None, "信用卡删除成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"删除信用卡失败: {str(e)}")


@router.get("/bills")
async def get_bills(
    card_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Bill).where(Bill.user_id == current_user.id)
        
        if card_id:
            query = query.where(Bill.card_id == card_id)
        if status:
            query = query.where(Bill.status == status)
        
        query = query.order_by(Bill.created_at.desc())
        
        result = await db.execute(query)
        bills = result.scalars().all()
        
        return success_response([{
            "id": bill.id,
            "card_id": bill.card_id,
            "bill_month": bill.bill_month,
            "total_amount": bill.total_amount,
            "min_repayment": bill.min_repayment,
            "bill_date": bill.bill_date.isoformat() if bill.bill_date else None,
            "repayment_date": bill.repayment_date.isoformat() if bill.repayment_date else None,
            "is_paid": bill.is_paid,
            "paid_amount": bill.paid_amount,
            "status": bill.status
        } for bill in bills])
    
    except Exception as e:
        return error_response(f"获取账单列表失败: {str(e)}")


@router.get("/bills/{bill_id}/details")
async def get_bill_details(
    bill_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Bill).where(
                Bill.id == bill_id,
                Bill.user_id == current_user.id
            )
        )
        bill = result.scalar_one_or_none()
        
        if not bill:
            return error_response("账单不存在")
        
        result = await db.execute(
            select(BillDetail).where(BillDetail.bill_id == bill_id)
        )
        details = result.scalars().all()
        
        return success_response({
            "bill": {
                "id": bill.id,
                "bill_month": bill.bill_month,
                "total_amount": bill.total_amount,
                "min_repayment": bill.min_repayment,
                "status": bill.status
            },
            "details": [{
                "id": detail.id,
                "transaction_date": detail.transaction_date.isoformat(),
                "merchant_name": detail.merchant_name,
                "amount": detail.amount,
                "transaction_type": detail.transaction_type,
                "description": detail.description
            } for detail in details]
        })
    
    except Exception as e:
        return error_response(f"获取账单详情失败: {str(e)}")


@router.post("/import")
async def import_bill(
    request: ImportBillRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(CreditCard).where(
                CreditCard.id == request.card_id,
                CreditCard.user_id == current_user.id
            )
        )
        card = result.scalar_one_or_none()
        
        if not card:
            return error_response("信用卡不存在")
        
        result = await db.execute(
            select(Bill).where(
                Bill.card_id == request.card_id,
                Bill.bill_month == request.bill_month
            )
        )
        existing_bill = result.scalar_one_or_none()
        
        if existing_bill:
            return error_response("该月账单已存在")
        
        bill = Bill(
            user_id=current_user.id,
            card_id=request.card_id,
            bill_month=request.bill_month,
            total_amount=request.total_amount,
            min_repayment=request.min_repayment,
            bill_date=datetime.fromisoformat(request.bill_date) if request.bill_date else None,
            repayment_date=datetime.fromisoformat(request.repayment_date) if request.repayment_date else None
        )
        db.add(bill)
        await db.flush()
        
        for detail_data in request.details:
            detail = BillDetail(
                bill_id=bill.id,
                transaction_date=datetime.fromisoformat(detail_data.get("transaction_date", "")),
                merchant_name=detail_data.get("merchant_name", ""),
                amount=detail_data.get("amount", 0.0),
                transaction_type=detail_data.get("transaction_type", "consume"),
                description=detail_data.get("description")
            )
            db.add(detail)
        
        card.current_bill = request.total_amount
        card.min_repayment = request.min_repayment
        card.used_limit = request.total_amount
        card.available_limit = card.credit_limit - card.used_limit
        
        current_user.growth_value += 100
        await db.commit()
        
        return success_response({
            "bill_id": bill.id,
            "bill_month": bill.bill_month,
            "total_amount": bill.total_amount
        }, "账单导入成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"导入账单失败: {str(e)}")


@router.post("/send-update-code")
async def send_update_code(
    card_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(CreditCard).where(
                CreditCard.id == card_id,
                CreditCard.user_id == current_user.id
            )
        )
        card = result.scalar_one_or_none()
        
        if not card:
            return error_response("信用卡不存在")
        
        if not current_user.phone:
            return error_response("请先绑定手机号")
        
        import random
        code = str(random.randint(100000, 999999))
        
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        verification_code = VerificationCode(
            user_id=current_user.id,
            type="bill_update",
            code=code,
            expires_at=expires_at
        )
        db.add(verification_code)
        await db.commit()
        
        return success_response({
            "expires_at": expires_at.isoformat()
        }, f"验证码已发送 (演示验证码: {code})")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"发送验证码失败: {str(e)}")


@router.post("/update")
async def update_bill(
    request: UpdateBillRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(VerificationCode).where(
                VerificationCode.user_id == current_user.id,
                VerificationCode.code == request.sms_code,
                VerificationCode.type == "bill_update",
                VerificationCode.used == False,
                VerificationCode.expires_at > datetime.utcnow()
            )
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            return error_response("验证码错误或已过期")
        
        result = await db.execute(
            select(CreditCard).where(
                CreditCard.id == request.card_id,
                CreditCard.user_id == current_user.id
            )
        )
        card = result.scalar_one_or_none()
        
        if not card:
            return error_response("信用卡不存在")
        
        verification.used = True
        card.last_updated = datetime.utcnow()
        await db.commit()
        
        return success_response({
            "card_id": card.id,
            "last_updated": card.last_updated.isoformat()
        }, "账单更新成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"更新账单失败: {str(e)}")


@router.post("/repay")
async def repay_bill(
    request: RepayRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Bill).where(
                Bill.id == request.bill_id,
                Bill.user_id == current_user.id
            )
        )
        bill = result.scalar_one_or_none()
        
        if not bill:
            return error_response("账单不存在")
        
        if bill.is_paid:
            return error_response("账单已还清")
        
        pay_amount = request.amount
        if request.pay_type == "full":
            pay_amount = bill.total_amount
        elif request.pay_type == "min":
            pay_amount = bill.min_repayment
        
        bill.paid_amount += pay_amount
        if bill.paid_amount >= bill.total_amount:
            bill.is_paid = True
            bill.status = "paid"
            bill.paid_at = datetime.utcnow()
        else:
            bill.status = "partial"
        
        current_user.growth_value += 20
        await db.commit()
        
        return success_response({
            "bill_id": bill.id,
            "paid_amount": bill.paid_amount,
            "is_paid": bill.is_paid
        }, "还款成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"还款失败: {str(e)}")


@router.get("/home")
async def get_home_data(
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
        
        has_bill = len(cards) > 0
        total_bill = sum(card.current_bill for card in cards)
        total_credit_limit = sum(card.credit_limit for card in cards)
        
        result = await db.execute(
            select(Bill).where(
                Bill.user_id == current_user.id,
                Bill.is_paid == False
            )
        )
        unpaid_bills = result.scalars().all()
        
        return success_response({
            "has_bill": has_bill,
            "total_bill": total_bill,
            "total_credit_limit": total_credit_limit,
            "card_count": len(cards),
            "unpaid_bill_count": len(unpaid_bills),
            "cards": [{
                "id": card.id,
                "bank_name": card.bank_name,
                "card_number": card.card_number,
                "current_bill": card.current_bill
            } for card in cards[:3]]
        })
    
    except Exception as e:
        return error_response(f"获取首页数据失败: {str(e)}")
