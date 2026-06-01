from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional, List

from ..config.database import get_db
from ..utils import success_response, error_response, get_current_active_user
from ..models import User, Loan

router = APIRouter(prefix="/loan", tags=["借钱"])


class ApplyLoanRequest(BaseModel):
    loan_amount: float
    term_months: int = Field(default=12, ge=1, le=36)
    purpose: Optional[str] = None


class VerifyRealNameRequest(BaseModel):
    real_name: str
    id_card: str


class VerifyOperatorRequest(BaseModel):
    phone: str
    verify_code: str


@router.get("/products")
async def get_loan_products():
    products = [
        {
            "id": 1,
            "name": "51人品贷",
            "min_amount": 1000,
            "max_amount": 200000,
            "interest_rate": 0.085,
            "min_term": 3,
            "max_term": 36,
            "description": "凭人品借款，最快1分钟到账"
        },
        {
            "id": 2,
            "name": "急速贷",
            "min_amount": 500,
            "max_amount": 50000,
            "interest_rate": 0.12,
            "min_term": 1,
            "max_term": 12,
            "description": "极速放款，30分钟到账"
        },
        {
            "id": 3,
            "name": "分期贷",
            "min_amount": 3000,
            "max_amount": 100000,
            "interest_rate": 0.075,
            "min_term": 6,
            "max_term": 24,
            "description": "灵活分期，轻松还款"
        }
    ]
    return success_response(products)


@router.get("/my-loans")
async def get_my_loans(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Loan).where(Loan.user_id == current_user.id)
        
        if status:
            query = query.where(Loan.status == status)
        
        query = query.order_by(Loan.applied_at.desc())
        
        result = await db.execute(query)
        loans = result.scalars().all()
        
        return success_response([{
            "id": loan.id,
            "loan_amount": loan.loan_amount,
            "interest_rate": loan.interest_rate,
            "term_months": loan.term_months,
            "monthly_payment": loan.monthly_payment,
            "total_interest": loan.total_interest,
            "total_repayment": loan.total_repayment,
            "status": loan.status,
            "purpose": loan.purpose,
            "real_name_verified": loan.real_name_verified,
            "operator_verified": loan.operator_verified,
            "applied_at": loan.applied_at.isoformat(),
            "approved_at": loan.approved_at.isoformat() if loan.approved_at else None,
            "disbursed_at": loan.disbursed_at.isoformat() if loan.disbursed_at else None
        } for loan in loans])
    
    except Exception as e:
        return error_response(f"获取借款列表失败: {str(e)}")


@router.post("/apply")
async def apply_loan(
    request: ApplyLoanRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if not current_user.real_name_verified:
            return error_response("请先完成实名认证")
        
        interest_rate = 0.085
        monthly_rate = interest_rate / 12
        monthly_payment = request.loan_amount * monthly_rate * (1 + monthly_rate) ** request.term_months / ((1 + monthly_rate) ** request.term_months - 1)
        total_repayment = monthly_payment * request.term_months
        total_interest = total_repayment - request.loan_amount
        
        loan = Loan(
            user_id=current_user.id,
            loan_amount=request.loan_amount,
            interest_rate=interest_rate,
            term_months=request.term_months,
            monthly_payment=round(monthly_payment, 2),
            total_interest=round(total_interest, 2),
            total_repayment=round(total_repayment, 2),
            status="pending",
            purpose=request.purpose,
            real_name_verified=current_user.real_name_verified
        )
        db.add(loan)
        
        current_user.growth_value += 150
        await db.commit()
        await db.refresh(loan)
        
        return success_response({
            "loan_id": loan.id,
            "loan_amount": loan.loan_amount,
            "term_months": loan.term_months,
            "monthly_payment": loan.monthly_payment,
            "status": loan.status
        }, "借款申请提交成功，请等待审核")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"借款申请失败: {str(e)}")


@router.post("/verify-real-name")
async def verify_real_name(
    request: VerifyRealNameRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if current_user.real_name_verified:
            return error_response("已完成实名认证")
        
        if len(request.id_card) not in [15, 18]:
            return error_response("身份证号格式不正确")
        
        current_user.real_name = request.real_name
        current_user.id_card = request.id_card
        current_user.real_name_verified = True
        
        current_user.growth_value += 100
        await db.commit()
        
        return success_response({
            "real_name_verified": True,
            "real_name": current_user.real_name
        }, "实名认证成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"实名认证失败: {str(e)}")


@router.post("/verify-operator")
async def verify_operator(
    request: VerifyOperatorRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if not current_user.phone:
            return error_response("请先绑定手机号")
        
        if current_user.phone != request.phone:
            return error_response("请使用绑定的手机号进行运营商认证")
        
        current_user.growth_value += 80
        await db.commit()
        
        return success_response({
            "operator_verified": True,
            "phone": request.phone
        }, "运营商认证成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"运营商认证失败: {str(e)}")


@router.get("/verification-status")
async def get_verification_status(
    current_user: User = Depends(get_current_active_user)
):
    return success_response({
        "real_name_verified": current_user.real_name_verified,
        "operator_verified": current_user.real_name_verified and bool(current_user.phone),
        "phone_bound": bool(current_user.phone)
    })
