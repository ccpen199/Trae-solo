from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional

from ..config.database import get_db
from ..utils import success_response, error_response, get_current_active_user
from ..models import User, WealthProduct, Investment

router = APIRouter(prefix="/wealth", tags=["财富"])


class InvestRequest(BaseModel):
    product_id: int
    amount: float


class OpenBankAccountRequest(BaseModel):
    bank_name: str
    account_number: str
    real_name: str
    id_card: str


@router.get("/products")
async def get_wealth_products(
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(WealthProduct).where(WealthProduct.is_active == True)
        
        if type:
            query = query.where(WealthProduct.type == type)
        
        result = await db.execute(query)
        products = result.scalars().all()
        
        return success_response([{
            "id": p.id,
            "name": p.name,
            "type": p.type,
            "description": p.description,
            "expected_annual_rate": p.expected_annual_rate,
            "min_investment": p.min_investment,
            "max_investment": p.max_investment,
            "term_days": p.term_days,
            "risk_level": p.risk_level,
            "total_amount": p.total_amount,
            "sold_amount": p.sold_amount
        } for p in products])
    
    except Exception as e:
        return error_response(f"获取产品列表失败: {str(e)}")


@router.get("/products/{product_id}")
async def get_product_detail(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(WealthProduct).where(
                WealthProduct.id == product_id,
                WealthProduct.is_active == True
            )
        )
        product = result.scalar_one_or_none()
        
        if not product:
            return error_response("产品不存在")
        
        return success_response({
            "id": product.id,
            "name": product.name,
            "type": product.type,
            "description": product.description,
            "expected_annual_rate": product.expected_annual_rate,
            "min_investment": product.min_investment,
            "max_investment": product.max_investment,
            "term_days": product.term_days,
            "risk_level": product.risk_level,
            "total_amount": product.total_amount,
            "sold_amount": product.sold_amount
        })
    
    except Exception as e:
        return error_response(f"获取产品详情失败: {str(e)}")


@router.get("/my-investments")
async def get_my_investments(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Investment).where(Investment.user_id == current_user.id)
        
        if status:
            query = query.where(Investment.status == status)
        
        query = query.order_by(Investment.purchase_date.desc())
        
        result = await db.execute(query)
        investments = result.scalars().all()
        
        return success_response([{
            "id": inv.id,
            "product_id": inv.product_id,
            "product_name": inv.product_name,
            "amount": inv.amount,
            "expected_earnings": inv.expected_earnings,
            "actual_earnings": inv.actual_earnings,
            "status": inv.status,
            "purchase_date": inv.purchase_date.isoformat(),
            "maturity_date": inv.maturity_date.isoformat() if inv.maturity_date else None
        } for inv in investments])
    
    except Exception as e:
        return error_response(f"获取投资列表失败: {str(e)}")


@router.post("/invest")
async def invest(
    request: InvestRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if not current_user.bank_account_opened:
            return error_response("请先开通银行账户")
        
        result = await db.execute(
            select(WealthProduct).where(
                WealthProduct.id == request.product_id,
                WealthProduct.is_active == True
            )
        )
        product = result.scalar_one_or_none()
        
        if not product:
            return error_response("产品不存在或已下架")
        
        if request.amount < product.min_investment:
            return error_response(f"最低投资金额为 {product.min_investment} 元")
        
        if product.max_investment and request.amount > product.max_investment:
            return error_response(f"最高投资金额为 {product.max_investment} 元")
        
        expected_earnings = request.amount * product.expected_annual_rate / 365 * product.term_days if product.term_days else 0
        
        maturity_date = None
        if product.term_days:
            maturity_date = datetime.utcnow() + timedelta(days=product.term_days)
        
        investment = Investment(
            user_id=current_user.id,
            product_id=product.id,
            product_name=product.name,
            amount=request.amount,
            expected_earnings=expected_earnings,
            status="investing",
            maturity_date=maturity_date
        )
        db.add(investment)
        
        product.sold_amount += request.amount
        
        current_user.growth_value += int(request.amount / 100)
        await db.commit()
        await db.refresh(investment)
        
        return success_response({
            "investment_id": investment.id,
            "amount": investment.amount,
            "expected_earnings": investment.expected_earnings
        }, "投资成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"投资失败: {str(e)}")


@router.post("/open-bank-account")
async def open_bank_account(
    request: OpenBankAccountRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if current_user.bank_account_opened:
            return error_response("银行账户已开通")
        
        current_user.bank_account_opened = True
        current_user.bank_name = request.bank_name
        current_user.bank_account = request.account_number
        current_user.real_name = request.real_name
        current_user.id_card = request.id_card
        current_user.real_name_verified = True
        
        current_user.growth_value += 200
        await db.commit()
        
        return success_response({
            "bank_name": current_user.bank_name,
            "bank_account": current_user.bank_account,
            "bank_account_opened": True
        }, "银行账户开通成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"开通失败: {str(e)}")


@router.get("/rp")
async def get_rp_info(
    current_user: User = Depends(get_current_active_user)
):
    return success_response({
        "user_id": current_user.id,
        "rp_value": current_user.growth_value,
        "level": current_user.level,
        "bank_account_opened": current_user.bank_account_opened
    })
