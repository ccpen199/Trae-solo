from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid
from models import (
    Order, Refund, PaymentTransaction, Merchant, AuditLog, User,
    OrderStatus, UserRole
)
from engines.idempotent_engine import IdempotentEngine

class RefundEngine:
    
    @staticmethod
    def generate_refund_no() -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:8].upper()
        return f"REF{timestamp}{random_part}"
    
    @staticmethod
    def create_refund(
        db: Session,
        order: Order,
        refund_amount: float,
        refund_reason: str,
        operator: User
    ) -> Refund:
        
        if order.status != OrderStatus.PAID:
            raise ValueError(f"Cannot refund order with status: {order.status}")
        
        total_refunded = db.query(Refund).filter(
            Refund.order_id == order.id,
            Refund.status.in_(["processing", "success"])
        ).all()
        
        total_refunded_amount = sum(r.refund_amount for r in total_refunded)
        
        if total_refunded_amount + refund_amount > order.amount:
            raise ValueError(f"Refund amount exceeds order amount. Total refunded: {total_refunded_amount}, Requested: {refund_amount}")
        
        merchant = db.query(Merchant).filter(Merchant.id == order.merchant_id).first()
        
        if merchant:
            if merchant.available_balance is None:
                merchant.available_balance = 0.0
            if merchant.frozen_balance is None:
                merchant.frozen_balance = 0.0
            
            if merchant.available_balance < refund_amount:
                raise ValueError(f"Merchant balance insufficient. Available: {merchant.available_balance}")
            
            merchant.available_balance -= refund_amount
            merchant.frozen_balance += refund_amount
        
        order.status = OrderStatus.REFUNDING
        
        refund_no = RefundEngine.generate_refund_no()
        
        refund = Refund(
            refund_no=refund_no,
            order_id=order.id,
            order_no=order.order_no,
            merchant_id=order.merchant_id,
            refund_amount=refund_amount,
            refund_reason=refund_reason,
            status="processing",
            processed_by=operator.id,
            created_at=datetime.utcnow()
        )
        db.add(refund)
        
        idempotent_key = IdempotentEngine.generate_idempotent_key("refund", refund_no)
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=operator.id,
            operator_role=operator.role.value if hasattr(operator.role, 'value') else str(operator.role),
            operator_name=operator.username,
            action_type="refund_create",
            resource_type="refund",
            resource_id=refund.id,
            order_id=order.id,
            order_no=order.order_no,
            description=f"创建退款申请，金额: {refund_amount}, 原因: {refund_reason}",
            old_value=json.dumps({
                "order_status": OrderStatus.PAID.value
            }, ensure_ascii=False),
            new_value=json.dumps({
                "order_status": OrderStatus.REFUNDING.value,
                "refund_no": refund_no,
                "refund_amount": refund_amount
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(refund)
        
        return refund
    
    @staticmethod
    def process_refund(
        db: Session,
        refund: Refund,
        success: bool = True,
        channel_refund_id: str = None,
        operator: User = None
    ) -> Refund:
        
        order = db.query(Order).filter(Order.id == refund.order_id).first()
        merchant = db.query(Merchant).filter(Merchant.id == refund.merchant_id).first()
        
        if success:
            refund.status = "success"
            refund.channel_refund_id = channel_refund_id or f"CRF{uuid.uuid4().hex[:16].upper()}"
            refund.processed_at = datetime.utcnow()
            refund.response_message = json.dumps({
                "status": "success",
                "channel_refund_id": refund.channel_refund_id,
                "processed_at": refund.processed_at.isoformat()
            }, ensure_ascii=False)
            
            if merchant and merchant.frozen_balance:
                merchant.frozen_balance -= refund.refund_amount
            
            total_refunded = db.query(Refund).filter(
                Refund.order_id == order.id,
                Refund.status == "success"
            ).all()
            total_refunded_amount = sum(r.refund_amount for r in total_refunded)
            
            if abs(total_refunded_amount - order.amount) < 0.01:
                order.status = OrderStatus.REFUNDED
            else:
                order.status = OrderStatus.PAID
            
            description = f"退款成功: {refund.refund_no}, 金额: {refund.refund_amount}"
        else:
            refund.status = "failed"
            refund.failure_reason = "Channel refund failed"
            refund.processed_at = datetime.utcnow()
            
            if merchant:
                if merchant.frozen_balance:
                    merchant.frozen_balance -= refund.refund_amount
                merchant.available_balance = (merchant.available_balance or 0) + refund.refund_amount
            
            if order.status == OrderStatus.REFUNDING:
                order.status = OrderStatus.PAID
            
            description = f"退款失败: {refund.refund_no}, 原因: 渠道退款失败"
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=operator.id if operator else None,
            operator_role=operator.role.value if operator and hasattr(operator.role, 'value') else "system",
            operator_name=operator.username if operator else "system",
            action_type="refund_process",
            resource_type="refund",
            resource_id=refund.id,
            order_id=order.id,
            order_no=order.order_no,
            description=description,
            new_value=json.dumps({
                "status": refund.status,
                "channel_refund_id": refund.channel_refund_id,
                "order_status": order.status.value if hasattr(order.status, 'value') else str(order.status)
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(refund)
        
        return refund
    
    @staticmethod
    def get_refund_trace(
        db: Session,
        refund_no: str
    ) -> dict:
        
        refund = db.query(Refund).filter(Refund.refund_no == refund_no).first()
        if not refund:
            return {"error": "Refund not found"}
        
        order = db.query(Order).filter(Order.id == refund.order_id).first()
        
        audit_logs = db.query(AuditLog).filter(
            (AuditLog.resource_type == "refund") & (AuditLog.resource_id == refund.id)
        ).order_by(AuditLog.created_at.asc()).all()
        
        return {
            "refund": {
                "refund_no": refund.refund_no,
                "order_no": refund.order_no,
                "refund_amount": refund.refund_amount,
                "refund_reason": refund.refund_reason,
                "status": refund.status,
                "channel_refund_id": refund.channel_refund_id,
                "failure_reason": refund.failure_reason,
                "created_at": refund.created_at.isoformat() if refund.created_at else None,
                "processed_at": refund.processed_at.isoformat() if refund.processed_at else None
            },
            "order": {
                "order_no": order.order_no,
                "amount": order.amount,
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status)
            } if order else None,
            "audit_trail": [
                {
                    "audit_no": log.audit_no,
                    "action_type": log.action_type,
                    "operator_name": log.operator_name,
                    "description": log.description,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in audit_logs
            ]
        }
