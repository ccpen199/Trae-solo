from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import uuid
from models import (
    Order, PaymentTransaction, Merchant, User, AuditLog,
    OrderStatus, PaymentChannel, UserRole
)
from config import settings

class PaymentAggregator:
    
    @staticmethod
    def generate_order_no() -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:8].upper()
        return f"ORD{timestamp}{random_part}"
    
    @staticmethod
    def generate_transaction_no() -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:10].upper()
        return f"TXN{timestamp}{random_part}"
    
    @staticmethod
    def create_order(
        db: Session,
        user: User,
        merchant_id: int,
        amount: float,
        channel: PaymentChannel,
        subject: str,
        body: str = "",
        merchant_order_no: str = None,
        client_ip: str = None,
        notify_url: str = None,
        return_url: str = None,
        attach: dict = None
    ) -> tuple[Order, PaymentTransaction]:
        
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        if not merchant:
            raise ValueError(f"Merchant with id {merchant_id} not found")
        
        order_no = PaymentAggregator.generate_order_no()
        
        fee_amount = round(amount * merchant.fee_rate, 2)
        
        order = Order(
            order_no=order_no,
            merchant_order_no=merchant_order_no or order_no,
            user_id=user.id,
            merchant_id=merchant_id,
            amount=amount,
            fee_amount=fee_amount,
            channel=channel,
            status=OrderStatus.PENDING,
            subject=subject,
            body=body,
            client_ip=client_ip,
            notify_url=notify_url or settings.callback_url,
            return_url=return_url,
            attach=json.dumps(attach, ensure_ascii=False) if attach else None,
            expired_at=datetime.utcnow() + timedelta(minutes=15),
            created_at=datetime.utcnow()
        )
        db.add(order)
        db.flush()
        
        transaction_no = PaymentAggregator.generate_transaction_no()
        transaction = PaymentTransaction(
            transaction_no=transaction_no,
            order_id=order.id,
            order_no=order_no,
            merchant_id=merchant_id,
            amount=amount,
            fee_amount=fee_amount,
            channel=channel,
            status="pending",
            transaction_type="payment",
            created_at=datetime.utcnow()
        )
        db.add(transaction)
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=user.id,
            operator_role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            operator_name=user.username,
            action_type="order_create",
            resource_type="order",
            resource_id=order.id,
            order_id=order.id,
            order_no=order_no,
            description=f"用户创建订单，金额: {amount}, 渠道: {channel.value}",
            ip_address=client_ip,
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(order)
        db.refresh(transaction)
        
        return order, transaction
    
    @staticmethod
    def get_prepay_params(
        db: Session,
        order: Order,
        transaction: PaymentTransaction,
        channel: PaymentChannel
    ) -> dict:
        
        prepay_id = f"PRE{uuid.uuid4().hex[:16].upper()}"
        
        prepay_params = {
            "order_no": order.order_no,
            "amount": order.amount,
            "channel": channel.value,
            "prepay_id": prepay_id,
            "timestamp": int(datetime.utcnow().timestamp()),
            "nonce_str": uuid.uuid4().hex[:16],
            "sign": f"SIGN_{uuid.uuid4().hex[:8].upper()}"
        }
        
        if channel == PaymentChannel.ALIPAY:
            prepay_params.update({
                "trade_type": "APP",
                "app_id": "2021001100000000",
                "method": "alipay.trade.app.pay"
            })
        elif channel == PaymentChannel.WECHAT:
            prepay_params.update({
                "trade_type": "JSAPI",
                "appid": "wxd678efh567hg6787",
                "mch_id": "1230000109"
            })
        elif channel == PaymentChannel.UNIONPAY:
            prepay_params.update({
                "version": "5.1.0",
                "biz_type": "000201"
            })
        
        order.prepay_id = prepay_id
        order.prepay_params = json.dumps(prepay_params, ensure_ascii=False)
        order.status = OrderStatus.PAYING
        
        transaction.request_message = json.dumps(prepay_params, ensure_ascii=False)
        transaction.status = "processing"
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=order.user_id,
            operator_role=UserRole.CUSTOMER.value,
            operator_name=order.user.username if order.user else "unknown",
            action_type="payment_start",
            resource_type="order",
            resource_id=order.id,
            order_id=order.id,
            order_no=order.order_no,
            description=f"订单进入支付流程，预支付ID: {prepay_id}",
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        
        return prepay_params
    
    @staticmethod
    def process_payment_callback(
        db: Session,
        order_no: str,
        channel_transaction_id: str,
        bank_type: str = None,
        success: bool = True
    ) -> tuple[Order, PaymentTransaction]:
        
        order = db.query(Order).filter(Order.order_no == order_no).first()
        if not order:
            raise ValueError(f"Order not found: {order_no}")
        
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_no == order_no,
            PaymentTransaction.transaction_type == "payment"
        ).first()
        if not transaction:
            raise ValueError(f"Transaction not found for order: {order_no}")
        
        if success:
            order.status = OrderStatus.PAID
            order.transaction_id = channel_transaction_id
            order.bank_type = bank_type
            order.paid_at = datetime.utcnow()
            
            transaction.status = "success"
            transaction.channel_transaction_id = channel_transaction_id
            transaction.processed_at = datetime.utcnow()
            transaction.response_message = json.dumps({
                "status": "success",
                "channel_transaction_id": channel_transaction_id,
                "bank_type": bank_type,
                "paid_at": order.paid_at.isoformat()
            }, ensure_ascii=False)
            
            merchant = db.query(Merchant).filter(Merchant.id == order.merchant_id).first()
            if merchant:
                merchant.pending_settlement = (merchant.pending_settlement or 0) + (order.amount - order.fee_amount)
            
            audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
            audit_log = AuditLog(
                audit_no=audit_no,
                operator_id=None,
                operator_role="system",
                operator_name="Payment-Gateway",
                action_type="payment_success",
                resource_type="order",
                resource_id=order.id,
                order_id=order.id,
                order_no=order.order_no,
                description=f"支付成功，渠道流水号: {channel_transaction_id}",
                new_value=json.dumps({
                    "status": OrderStatus.PAID.value,
                    "transaction_id": channel_transaction_id,
                    "paid_at": order.paid_at.isoformat()
                }, ensure_ascii=False),
                created_at=datetime.utcnow()
            )
            db.add(audit_log)
        else:
            order.status = OrderStatus.FAILED
            transaction.status = "failed"
            transaction.processed_at = datetime.utcnow()
            
            audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
            audit_log = AuditLog(
                audit_no=audit_no,
                operator_id=None,
                operator_role="system",
                operator_name="Payment-Gateway",
                action_type="payment_failed",
                resource_type="order",
                resource_id=order.id,
                order_id=order.id,
                order_no=order.order_no,
                description="支付失败",
                created_at=datetime.utcnow()
            )
            db.add(audit_log)
        
        db.commit()
        db.refresh(order)
        db.refresh(transaction)
        
        return order, transaction
    
    @staticmethod
    def get_order_trace(db: Session, order_no: str) -> dict:
        
        order = db.query(Order).filter(Order.order_no == order_no).first()
        if not order:
            return {"error": "Order not found"}
        
        transactions = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_no == order_no
        ).order_by(PaymentTransaction.created_at.asc()).all()
        
        audit_logs = db.query(AuditLog).filter(
            AuditLog.order_no == order_no
        ).order_by(AuditLog.created_at.asc()).all()
        
        refunds = []
        if hasattr(order, 'refunds'):
            refunds = order.refunds
        
        return {
            "order": {
                "order_no": order.order_no,
                "amount": order.amount,
                "fee_amount": order.fee_amount,
                "channel": order.channel.value if hasattr(order.channel, 'value') else str(order.channel),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "subject": order.subject,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "paid_at": order.paid_at.isoformat() if order.paid_at else None,
                "transaction_id": order.transaction_id
            },
            "merchant": {
                "id": order.merchant.id if order.merchant else None,
                "name": order.merchant.merchant_name if order.merchant else None
            } if order.merchant else None,
            "transactions": [
                {
                    "transaction_no": txn.transaction_no,
                    "type": txn.transaction_type,
                    "amount": txn.amount,
                    "channel": txn.channel.value if hasattr(txn.channel, 'value') else str(txn.channel),
                    "channel_transaction_id": txn.channel_transaction_id,
                    "status": txn.status,
                    "created_at": txn.created_at.isoformat() if txn.created_at else None,
                    "processed_at": txn.processed_at.isoformat() if txn.processed_at else None
                }
                for txn in transactions
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
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in audit_logs
            ],
            "refunds": [
                {
                    "refund_no": refund.refund_no,
                    "amount": refund.refund_amount,
                    "status": refund.status,
                    "created_at": refund.created_at.isoformat() if refund.created_at else None
                }
                for refund in refunds
            ]
        }
