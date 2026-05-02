from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from database import get_db
from models import (
    User, Merchant, Order, ProfitSharing, PayoutInstruction,
    UserRole, OrderStatus, PaymentChannel
)
from auth import get_current_user, require_roles, require_merchant_access
from engines.clearing_settlement import ClearingSettlementEngine

router = APIRouter(prefix="/api/v1/merchant", tags=["商户"])

class CreatePayoutRequest(BaseModel):
    amount: float = Field(..., gt=0)

@router.get("/dashboard")
def get_merchant_dashboard(
    current_user_and_merchant: tuple[User, Merchant] = Depends(require_merchant_access()),
    db: Session = Depends(get_db)
):
    user, merchant = current_user_and_merchant
    
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    today_orders = db.query(Order).filter(
        Order.merchant_id == merchant.id,
        Order.status == OrderStatus.PAID,
        Order.paid_at >= today_start
    ).all()
    
    today_amount = sum(o.amount for o in today_orders)
    today_fee = sum(o.fee_amount for o in today_orders)
    
    pending_settlement = db.query(Order).filter(
        Order.merchant_id == merchant.id,
        Order.status == OrderStatus.PAID
    ).all()
    
    total_pending = sum(o.amount - o.fee_amount for o in pending_settlement)
    
    recent_orders = db.query(Order).filter(
        Order.merchant_id == merchant.id
    ).order_by(Order.created_at.desc()).limit(10).all()
    
    return {
        "success": True,
        "data": {
            "merchant": {
                "id": merchant.id,
                "name": merchant.merchant_name,
                "code": merchant.merchant_code
            },
            "balance": {
                "available": merchant.available_balance or 0.0,
                "frozen": merchant.frozen_balance or 0.0,
                "pending_settlement": merchant.pending_settlement or 0.0
            },
            "today": {
                "order_count": len(today_orders),
                "total_amount": today_amount,
                "fee_amount": today_fee
            },
            "recent_orders": [
                {
                    "order_no": o.order_no,
                    "amount": o.amount,
                    "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
                    "subject": o.subject,
                    "created_at": o.created_at.isoformat() if o.created_at else None
                }
                for o in recent_orders
            ]
        }
    }

@router.get("/balance")
def get_balance_trace(
    current_user_and_merchant: tuple[User, Merchant] = Depends(require_merchant_access()),
    db: Session = Depends(get_db)
):
    user, merchant = current_user_and_merchant
    
    trace = ClearingSettlementEngine.get_merchant_balance_trace(db, merchant.id)
    
    return {
        "success": True,
        "data": trace
    }

@router.post("/payout")
def create_payout(
    payout_data: CreatePayoutRequest,
    current_user_and_merchant: tuple[User, Merchant] = Depends(require_merchant_access()),
    db: Session = Depends(get_db)
):
    user, merchant = current_user_and_merchant
    
    try:
        payout = ClearingSettlementEngine.create_payout_instruction(
            db=db,
            merchant=merchant,
            amount=payout_data.amount,
            operator=user
        )
        
        payout = ClearingSettlementEngine.process_payout(
            db=db,
            payout=payout,
            success=True,
            operator=user
        )
        
        return {
            "success": True,
            "data": {
                "payout_no": payout.payout_no,
                "amount": payout.amount,
                "bank_account": payout.bank_account,
                "bank_name": payout.bank_name,
                "status": payout.status,
                "channel_payout_id": payout.channel_payout_id,
                "created_at": payout.created_at.isoformat() if payout.created_at else None
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/payouts")
def list_payouts(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user_and_merchant: tuple[User, Merchant] = Depends(require_merchant_access()),
    db: Session = Depends(get_db)
):
    user, merchant = current_user_and_merchant
    
    query = db.query(PayoutInstruction).filter(
        PayoutInstruction.merchant_id == merchant.id
    )
    
    if status:
        query = query.filter(PayoutInstruction.status == status)
    
    total = query.count()
    payouts = query.order_by(PayoutInstruction.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "payouts": [
                {
                    "payout_no": p.payout_no,
                    "amount": p.amount,
                    "bank_account": p.bank_account,
                    "bank_name": p.bank_name,
                    "status": p.status,
                    "channel_payout_id": p.channel_payout_id,
                    "failure_reason": p.failure_reason,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "processed_at": p.processed_at.isoformat() if p.processed_at else None
                }
                for p in payouts
            ]
        }
    }

@router.get("/profit-sharings")
def list_profit_sharings(
    skip: int = 0,
    limit: int = 20,
    current_user_and_merchant: tuple[User, Merchant] = Depends(require_merchant_access()),
    db: Session = Depends(get_db)
):
    user, merchant = current_user_and_merchant
    
    query = db.query(ProfitSharing).filter(
        ProfitSharing.merchant_id == merchant.id
    )
    
    total = query.count()
    sharings = query.order_by(ProfitSharing.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "profit_sharings": [
                {
                    "sharing_no": s.sharing_no,
                    "order_no": s.order_no,
                    "total_amount": s.total_amount,
                    "merchant_amount": s.merchant_amount,
                    "platform_fee": s.platform_fee,
                    "channel_fee": s.channel_fee,
                    "status": s.status,
                    "created_at": s.created_at.isoformat() if s.created_at else None
                }
                for s in sharings
            ]
        }
    }

@router.get("/orders")
def list_merchant_orders(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user_and_merchant: tuple[User, Merchant] = Depends(require_merchant_access()),
    db: Session = Depends(get_db)
):
    user, merchant = current_user_and_merchant
    
    query = db.query(Order).filter(Order.merchant_id == merchant.id)
    
    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.filter(Order.status == status_enum)
        except ValueError:
            pass
    
    if channel:
        try:
            channel_enum = PaymentChannel(channel)
            query = query.filter(Order.channel == channel_enum)
        except ValueError:
            pass
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Order.created_at >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Order.created_at <= end)
        except ValueError:
            pass
    
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "orders": [
                {
                    "order_no": o.order_no,
                    "merchant_order_no": o.merchant_order_no,
                    "amount": o.amount,
                    "fee_amount": o.fee_amount,
                    "channel": o.channel.value if hasattr(o.channel, 'value') else str(o.channel),
                    "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
                    "subject": o.subject,
                    "transaction_id": o.transaction_id,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                    "paid_at": o.paid_at.isoformat() if o.paid_at else None
                }
                for o in orders
            ]
        }
    }
