from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import get_db
from models import (
    User, AuditLog, Order, PaymentTransaction, Refund,
    UserRole
)
from auth import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/audit", tags=["审计"])

@router.get("/logs")
def list_audit_logs(
    skip: int = 0,
    limit: int = 50,
    action_type: Optional[str] = None,
    operator_name: Optional[str] = None,
    order_no: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.FINANCE)),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    
    if operator_name:
        query = query.filter(AuditLog.operator_name.contains(operator_name))
    
    if order_no:
        query = query.filter(AuditLog.order_no == order_no)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(AuditLog.created_at >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(AuditLog.created_at <= end)
        except ValueError:
            pass
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "logs": [
                {
                    "audit_no": log.audit_no,
                    "action_type": log.action_type,
                    "operator_id": log.operator_id,
                    "operator_role": log.operator_role,
                    "operator_name": log.operator_name,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "order_no": log.order_no,
                    "description": log.description,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ]
        }
    }

@router.get("/log/{audit_no}")
def get_audit_log_detail(
    audit_no: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.FINANCE)),
    db: Session = Depends(get_db)
):
    log = db.query(AuditLog).filter(AuditLog.audit_no == audit_no).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    related_data = {}
    
    if log.order_no:
        order = db.query(Order).filter(Order.order_no == log.order_no).first()
        if order:
            related_data["order"] = {
                "order_no": order.order_no,
                "amount": order.amount,
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "created_at": order.created_at.isoformat() if order.created_at else None
            }
            
            transactions = db.query(PaymentTransaction).filter(
                PaymentTransaction.order_no == log.order_no
            ).all()
            related_data["transactions"] = [
                {
                    "transaction_no": t.transaction_no,
                    "amount": t.amount,
                    "status": t.status,
                    "channel_transaction_id": t.channel_transaction_id,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                }
                for t in transactions
            ]
            
            refunds = db.query(Refund).filter(Refund.order_no == log.order_no).all()
            related_data["refunds"] = [
                {
                    "refund_no": r.refund_no,
                    "refund_amount": r.refund_amount,
                    "status": r.status,
                    "created_at": r.created_at.isoformat() if r.created_at else None
                }
                for r in refunds
            ]
    
    return {
        "success": True,
        "data": {
            "log": {
                "audit_no": log.audit_no,
                "action_type": log.action_type,
                "operator_id": log.operator_id,
                "operator_role": log.operator_role,
                "operator_name": log.operator_name,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "order_no": log.order_no,
                "description": log.description,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "created_at": log.created_at.isoformat() if log.created_at else None
            },
            "related_data": related_data
        }
    }

@router.get("/order-trace/{order_no}")
def get_full_order_trace(
    order_no: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.FINANCE)),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_no == order_no).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    transactions = db.query(PaymentTransaction).filter(
        PaymentTransaction.order_no == order_no
    ).order_by(PaymentTransaction.created_at.asc()).all()
    
    refunds = db.query(Refund).filter(
        Refund.order_no == order_no
    ).order_by(Refund.created_at.asc()).all()
    
    audit_logs = db.query(AuditLog).filter(
        AuditLog.order_no == order_no
    ).order_by(AuditLog.created_at.asc()).all()
    
    return {
        "success": True,
        "data": {
            "order": {
                "order_no": order.order_no,
                "merchant_order_no": order.merchant_order_no,
                "user_id": order.user_id,
                "merchant_id": order.merchant_id,
                "amount": order.amount,
                "fee_amount": order.fee_amount,
                "channel": order.channel.value if hasattr(order.channel, 'value') else str(order.channel),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "subject": order.subject,
                "prepay_id": order.prepay_id,
                "transaction_id": order.transaction_id,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "paid_at": order.paid_at.isoformat() if order.paid_at else None
            },
            "transactions": [
                {
                    "transaction_no": t.transaction_no,
                    "type": t.transaction_type,
                    "amount": t.amount,
                    "fee_amount": t.fee_amount,
                    "channel": t.channel.value if hasattr(t.channel, 'value') else str(t.channel),
                    "channel_transaction_id": t.channel_transaction_id,
                    "status": t.status,
                    "request_message": t.request_message,
                    "response_message": t.response_message,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                    "processed_at": t.processed_at.isoformat() if t.processed_at else None
                }
                for t in transactions
            ],
            "refunds": [
                {
                    "refund_no": r.refund_no,
                    "refund_amount": r.refund_amount,
                    "refund_reason": r.refund_reason,
                    "channel_refund_id": r.channel_refund_id,
                    "status": r.status,
                    "failure_reason": r.failure_reason,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "processed_at": r.processed_at.isoformat() if r.processed_at else None
                }
                for r in refunds
            ],
            "audit_trail": [
                {
                    "audit_no": log.audit_no,
                    "action_type": log.action_type,
                    "operator_name": log.operator_name,
                    "operator_role": log.operator_role,
                    "description": log.description,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in audit_logs
            ]
        }
    }

@router.get("/action-types")
def get_action_types(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.FINANCE)),
    db: Session = Depends(get_db)
):
    from sqlalchemy import distinct
    
    action_types = db.query(distinct(AuditLog.action_type)).all()
    
    return {
        "success": True,
        "data": {
            "action_types": [at[0] for at in action_types if at[0]]
        }
    }
