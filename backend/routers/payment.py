from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from database import get_db
from models import (
    User, Merchant, Order, PaymentTransaction, Refund,
    UserRole, PaymentChannel, OrderStatus
)
from auth import get_current_user, check_merchant_order_access
from engines.payment_aggregator import PaymentAggregator
from engines.refund_engine import RefundEngine
from engines.idempotent_engine import IdempotentEngine

router = APIRouter(prefix="/api/v1/payment", tags=["支付"])

class CreateOrderRequest(BaseModel):
    merchant_id: int
    amount: float = Field(..., gt=0)
    channel: PaymentChannel
    subject: str
    body: Optional[str] = ""
    merchant_order_no: Optional[str] = None
    client_ip: Optional[str] = None
    notify_url: Optional[str] = None
    return_url: Optional[str] = None
    attach: Optional[dict] = None

class RefundRequest(BaseModel):
    order_no: str
    refund_amount: float = Field(..., gt=0)
    refund_reason: str

class OrderResponse(BaseModel):
    order_no: str
    merchant_order_no: Optional[str]
    amount: float
    fee_amount: float
    channel: str
    status: str
    subject: str
    body: Optional[str]
    transaction_id: Optional[str]
    created_at: Optional[str]
    paid_at: Optional[str]

class PrepayResponse(BaseModel):
    order_no: str
    prepay_id: str
    prepay_params: dict
    status: str

@router.post("/order", response_model=dict)
def create_order(
    order_data: CreateOrderRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).filter(Merchant.id == order_data.merchant_id).first()
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant not found"
        )
    
    if merchant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant is not active"
        )
    
    client_ip = order_data.client_ip
    if not client_ip:
        client_ip = request.client.host if request.client else "127.0.0.1"
    
    try:
        order, transaction = PaymentAggregator.create_order(
            db=db,
            user=current_user,
            merchant_id=order_data.merchant_id,
            amount=order_data.amount,
            channel=order_data.channel,
            subject=order_data.subject,
            body=order_data.body or "",
            merchant_order_no=order_data.merchant_order_no,
            client_ip=client_ip,
            notify_url=order_data.notify_url,
            return_url=order_data.return_url,
            attach=order_data.attach
        )
        
        prepay_params = PaymentAggregator.get_prepay_params(
            db=db,
            order=order,
            transaction=transaction,
            channel=order_data.channel
        )
        
        return {
            "success": True,
            "data": {
                "order_no": order.order_no,
                "amount": order.amount,
                "prepay_params": prepay_params,
                "status": OrderStatus.PAYING.value
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/order/{order_no}")
def get_order(
    order_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_no == order_no).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        if current_user.id != order.user_id and not check_merchant_order_access(order.merchant_id, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return {
        "success": True,
        "data": PaymentAggregator.get_order_trace(db, order_no)
    }

@router.get("/orders")
def list_orders(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    
    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(Order.user_id == current_user.id)
    elif current_user.merchant_id:
        query = query.filter(Order.merchant_id == current_user.merchant_id)
    
    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.filter(Order.status == status_enum)
        except ValueError:
            pass
    
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    order_list = []
    for order in orders:
        order_list.append({
            "order_no": order.order_no,
            "merchant_order_no": order.merchant_order_no,
            "amount": order.amount,
            "fee_amount": order.fee_amount,
            "channel": order.channel.value if hasattr(order.channel, 'value') else str(order.channel),
            "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
            "subject": order.subject,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "paid_at": order.paid_at.isoformat() if order.paid_at else None
        })
    
    return {
        "success": True,
        "data": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "orders": order_list
        }
    }

@router.post("/callback")
async def payment_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    body = await request.json()
    
    order_no = body.get("order_no") or body.get("out_trade_no")
    channel_transaction_id = body.get("transaction_id") or body.get("trade_no")
    success = body.get("success", True)
    bank_type = body.get("bank_type")
    
    if not order_no:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing order_no"
        )
    
    if not channel_transaction_id:
        channel_transaction_id = f"CH{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    try:
        order, transaction = PaymentAggregator.process_payment_callback(
            db=db,
            order_no=order_no,
            channel_transaction_id=channel_transaction_id,
            bank_type=bank_type,
            success=success
        )
        
        if success:
            from engines.clearing_settlement import ClearingSettlementEngine
            try:
                ClearingSettlementEngine.calculate_profit_sharing(
                    db=db,
                    order=order,
                    transaction=transaction
                )
            except Exception as e:
                print(f"Profit sharing error: {e}")
        
        return {
            "code": "SUCCESS",
            "message": "Callback processed successfully",
            "order_no": order_no,
            "status": order.status.value if hasattr(order.status, 'value') else str(order.status)
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/refund")
def create_refund(
    refund_data: RefundRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_no == refund_data.order_no).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE, UserRole.MERCHANT_ADMIN, UserRole.MERCHANT_OPERATOR]:
        if current_user.id != order.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    try:
        refund = RefundEngine.create_refund(
            db=db,
            order=order,
            refund_amount=refund_data.refund_amount,
            refund_reason=refund_data.refund_reason,
            operator=current_user
        )
        
        refund = RefundEngine.process_refund(
            db=db,
            refund=refund,
            success=True,
            operator=current_user
        )
        
        return {
            "success": True,
            "data": {
                "refund_no": refund.refund_no,
                "order_no": refund.order_no,
                "refund_amount": refund.refund_amount,
                "status": refund.status
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/refund/{refund_no}")
def get_refund(
    refund_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return {
        "success": True,
        "data": RefundEngine.get_refund_trace(db, refund_no)
    }

@router.get("/trace/{order_no}")
def get_order_trace(
    order_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_no == order_no).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        if current_user.id != order.user_id and not check_merchant_order_access(order.merchant_id, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return {
        "success": True,
        "data": PaymentAggregator.get_order_trace(db, order_no)
    }
