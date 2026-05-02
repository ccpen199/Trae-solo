from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid
from models import (
    Order, Merchant, ProfitSharing, PayoutInstruction,
    PaymentTransaction, AuditLog, User, UserRole,
    OrderStatus, PaymentChannel
)

class ClearingSettlementEngine:
    
    @staticmethod
    def generate_sharing_no() -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:8].upper()
        return f"SHR{timestamp}{random_part}"
    
    @staticmethod
    def generate_payout_no() -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:8].upper()
        return f"PAY{timestamp}{random_part}"
    
    @staticmethod
    def calculate_profit_sharing(
        db: Session,
        order: Order,
        transaction: PaymentTransaction
    ) -> ProfitSharing:
        
        merchant = db.query(Merchant).filter(Merchant.id == order.merchant_id).first()
        if not merchant:
            raise ValueError(f"Merchant not found for order {order.order_no}")
        
        total_amount = order.amount
        fee_amount = order.fee_amount
        
        platform_fee = round(total_amount * 0.003, 2)
        channel_fee = round(total_amount * 0.003, 2)
        merchant_amount = round(total_amount - platform_fee - channel_fee, 2)
        
        sharing_no = ClearingSettlementEngine.generate_sharing_no()
        
        sharing = ProfitSharing(
            sharing_no=sharing_no,
            order_id=order.id,
            order_no=order.order_no,
            merchant_id=merchant.id,
            transaction_no=transaction.transaction_no,
            total_amount=total_amount,
            merchant_amount=merchant_amount,
            platform_fee=platform_fee,
            channel_fee=channel_fee,
            other_partners=json.dumps({
                "profit_sharing_ratio": merchant.profit_sharing_ratio
            }, ensure_ascii=False),
            status="completed",
            processed_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(sharing)
        
        if merchant.available_balance is None:
            merchant.available_balance = 0.0
        merchant.available_balance += merchant_amount
        if merchant.pending_settlement:
            merchant.pending_settlement -= merchant_amount
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=None,
            operator_role="system",
            operator_name="Clearing-Engine",
            action_type="profit_sharing",
            resource_type="order",
            resource_id=order.id,
            order_id=order.id,
            order_no=order.order_no,
            description=f"清分分润完成：商户得款 {merchant_amount}，平台手续费 {platform_fee}，渠道手续费 {channel_fee}",
            new_value=json.dumps({
                "sharing_no": sharing_no,
                "total_amount": total_amount,
                "merchant_amount": merchant_amount,
                "platform_fee": platform_fee,
                "channel_fee": channel_fee
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(sharing)
        
        return sharing
    
    @staticmethod
    def create_payout_instruction(
        db: Session,
        merchant: Merchant,
        amount: float,
        operator: User = None
    ) -> PayoutInstruction:
        
        if merchant.available_balance < amount:
            raise ValueError(f"Insufficient balance. Available: {merchant.available_balance}, Requested: {amount}")
        
        if amount <= 0:
            raise ValueError("Payout amount must be positive")
        
        payout_no = ClearingSettlementEngine.generate_payout_no()
        
        merchant.available_balance -= amount
        if merchant.frozen_balance is None:
            merchant.frozen_balance = 0.0
        merchant.frozen_balance += amount
        
        payout = PayoutInstruction(
            payout_no=payout_no,
            merchant_id=merchant.id,
            amount=amount,
            bank_account=merchant.settlement_account,
            bank_name=merchant.settlement_bank,
            account_name=merchant.merchant_name,
            status="pending",
            processed_by=operator.id if operator else None,
            created_at=datetime.utcnow()
        )
        db.add(payout)
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=operator.id if operator else None,
            operator_role=operator.role.value if operator and hasattr(operator.role, 'value') else "system",
            operator_name=operator.username if operator else "system",
            action_type="payout_create",
            resource_type="payout",
            resource_id=payout.id,
            description=f"创建打款指令，金额: {amount}, 收款账户: {merchant.settlement_account}",
            new_value=json.dumps({
                "payout_no": payout_no,
                "amount": amount,
                "bank_account": merchant.settlement_account,
                "bank_name": merchant.settlement_bank
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(payout)
        
        return payout
    
    @staticmethod
    def process_payout(
        db: Session,
        payout: PayoutInstruction,
        success: bool = True,
        operator: User = None,
        channel_response: dict = None
    ) -> PayoutInstruction:
        
        merchant = db.query(Merchant).filter(Merchant.id == payout.merchant_id).first()
        
        if success:
            payout.status = "success"
            payout.channel_payout_id = f"CHP{uuid.uuid4().hex[:16].upper()}"
            payout.channel_batch_no = f"BAT{datetime.utcnow().strftime('%Y%m%d')}"
            payout.processed_at = datetime.utcnow()
            
            if merchant and merchant.frozen_balance:
                merchant.frozen_balance -= payout.amount
            
            description = f"打款成功: {payout.payout_no}, 金额: {payout.amount}"
        else:
            payout.status = "failed"
            payout.failure_reason = "Channel processing failed"
            payout.processed_at = datetime.utcnow()
            
            if merchant:
                if merchant.frozen_balance:
                    merchant.frozen_balance -= payout.amount
                merchant.available_balance = (merchant.available_balance or 0) + payout.amount
            
            description = f"打款失败: {payout.payout_no}, 原因: 渠道处理失败"
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=operator.id if operator else None,
            operator_role=operator.role.value if operator and hasattr(operator.role, 'value') else "system",
            operator_name=operator.username if operator else "system",
            action_type="payout_process",
            resource_type="payout",
            resource_id=payout.id,
            description=description,
            new_value=json.dumps({
                "status": payout.status,
                "channel_payout_id": payout.channel_payout_id,
                "processed_at": payout.processed_at.isoformat() if payout.processed_at else None
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(payout)
        
        return payout
    
    @staticmethod
    def get_merchant_balance_trace(
        db: Session,
        merchant_id: int
    ) -> dict:
        
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        if not merchant:
            return {"error": "Merchant not found"}
        
        profit_sharings = db.query(ProfitSharing).filter(
            ProfitSharing.merchant_id == merchant_id
        ).order_by(ProfitSharing.created_at.desc()).limit(50).all()
        
        payouts = db.query(PayoutInstruction).filter(
            PayoutInstruction.merchant_id == merchant_id
        ).order_by(PayoutInstruction.created_at.desc()).limit(50).all()
        
        return {
            "merchant": {
                "id": merchant.id,
                "name": merchant.merchant_name,
                "code": merchant.merchant_code,
                "available_balance": merchant.available_balance or 0.0,
                "frozen_balance": merchant.frozen_balance or 0.0,
                "pending_settlement": merchant.pending_settlement or 0.0
            },
            "recent_profit_sharings": [
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
                for s in profit_sharings
            ],
            "recent_payouts": [
                {
                    "payout_no": p.payout_no,
                    "amount": p.amount,
                    "status": p.status,
                    "bank_account": p.bank_account,
                    "channel_payout_id": p.channel_payout_id,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "processed_at": p.processed_at.isoformat() if p.processed_at else None
                }
                for p in payouts
            ]
        }
