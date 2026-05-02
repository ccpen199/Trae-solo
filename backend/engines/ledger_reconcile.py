from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
import json
import uuid
from typing import List, Dict, Any, Optional
from models import (
    Reconciliation, ReconciliationItem, ChannelBill,
    PaymentTransaction, Order, AuditLog, Merchant, User,
    PaymentChannel, ReconciliationStatus, OrderStatus
)

class LedgerReconcileEngine:
    
    @staticmethod
    def generate_reconciliation_no() -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:8].upper()
        return f"REC{timestamp}{random_part}"
    
    @staticmethod
    def generate_bill_no() -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:6].upper()
        return f"BIL{timestamp}{random_part}"
    
    @staticmethod
    def download_channel_bill(
        db: Session,
        channel: PaymentChannel,
        bill_date: date,
        operator: Optional[User] = None
    ) -> ChannelBill:
        
        bill_no = LedgerReconcileEngine.generate_bill_no()
        
        mock_transactions = []
        today_transactions = db.query(PaymentTransaction).filter(
            PaymentTransaction.channel == channel,
            PaymentTransaction.status == "success"
        ).limit(10).all()
        
        for txn in today_transactions:
            mock_transactions.append({
                "channel_transaction_id": txn.channel_transaction_id or f"MOCK{uuid.uuid4().hex[:12].upper()}",
                "order_no": txn.order_no,
                "amount": txn.amount,
                "fee": round(txn.amount * 0.003, 2),
                "type": "payment",
                "trade_time": txn.created_at.isoformat() if txn.created_at else datetime.utcnow().isoformat()
            })
        
        for i in range(3):
            mock_transactions.append({
                "channel_transaction_id": f"CH{uuid.uuid4().hex[:12].upper()}",
                "order_no": f"UNKNOWN{uuid.uuid4().hex[:8].upper()}",
                "amount": round(100 + i * 50, 2),
                "fee": round((100 + i * 50) * 0.003, 2),
                "type": "payment",
                "trade_time": datetime.utcnow().isoformat()
            })
        
        bill = ChannelBill(
            bill_no=bill_no,
            channel=channel,
            bill_date=datetime.combine(bill_date, datetime.min.time()),
            file_name=f"{channel.value}_{bill_date.strftime('%Y%m%d')}.csv",
            file_path=f"/data/bills/{channel.value}/{bill_date.strftime('%Y%m%d')}.csv",
            total_count=len(mock_transactions),
            total_amount=sum(t["amount"] for t in mock_transactions),
            status="downloaded",
            created_at=datetime.utcnow()
        )
        db.add(bill)
        db.flush()
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=operator.id if operator else None,
            operator_role=operator.role.value if operator and hasattr(operator.role, 'value') else "system",
            operator_name=operator.username if operator else "system",
            action_type="bill_download",
            resource_type="channel_bill",
            resource_id=bill.id,
            description=f"下载{channel.value}渠道账单，日期: {bill_date}, 笔数: {len(mock_transactions)}",
            new_value=json.dumps({
                "bill_no": bill_no,
                "channel": channel.value,
                "bill_date": bill_date.isoformat(),
                "total_count": len(mock_transactions),
                "total_amount": sum(t["amount"] for t in mock_transactions)
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(bill)
        
        return bill
    
    @staticmethod
    def perform_reconciliation(
        db: Session,
        channel: PaymentChannel,
        reconciliation_date: date,
        channel_bill_data: List[Dict],
        operator: Optional[User] = None
    ) -> Reconciliation:
        
        reconciliation_no = LedgerReconcileEngine.generate_reconciliation_no()
        
        start_time = datetime.combine(reconciliation_date, datetime.min.time())
        end_time = datetime.combine(reconciliation_date + timedelta(days=1), datetime.min.time())
        
        system_transactions = db.query(PaymentTransaction).filter(
            PaymentTransaction.channel == channel,
            PaymentTransaction.status == "success",
            PaymentTransaction.created_at >= start_time,
            PaymentTransaction.created_at < end_time
        ).all()
        
        system_txns_by_channel_id = {}
        for txn in system_transactions:
            if txn.channel_transaction_id:
                system_txns_by_channel_id[txn.channel_transaction_id] = txn
        
        channel_txns_by_id = {}
        for txn_data in channel_bill_data:
            channel_id = txn_data.get("channel_transaction_id")
            if channel_id:
                channel_txns_by_id[channel_id] = txn_data
        
        matched_count = 0
        mismatch_count = 0
        reconciliation_items = []
        
        all_channel_ids = set(channel_txns_by_id.keys())
        all_system_ids = set(system_txns_by_channel_id.keys())
        all_ids = all_channel_ids.union(all_system_ids)
        
        for channel_id in all_ids:
            channel_txn = channel_txns_by_id.get(channel_id)
            system_txn = system_txns_by_channel_id.get(channel_id)
            
            item = ReconciliationItem()
            
            if channel_txn and system_txn:
                item.order_no = system_txn.order_no
                item.transaction_no = system_txn.transaction_no
                item.channel_transaction_id = channel_id
                item.transaction_type = system_txn.transaction_type
                item.system_amount = system_txn.amount
                item.channel_amount = channel_txn.get("amount")
                item.difference = abs(item.system_amount - item.channel_amount)
                
                if abs(item.system_amount - item.channel_amount) < 0.01:
                    item.status = ReconciliationStatus.MATCHED
                    matched_count += 1
                else:
                    item.status = ReconciliationStatus.MISMATCH
                    item.issue_type = "amount_mismatch"
                    item.issue_description = f"金额不一致: 系统{system_txn.amount} vs 渠道{channel_txn.get('amount')}"
                    mismatch_count += 1
            
            elif channel_txn and not system_txn:
                item.order_no = channel_txn.get("order_no", "UNKNOWN")
                item.channel_transaction_id = channel_id
                item.transaction_type = channel_txn.get("type", "unknown")
                item.channel_amount = channel_txn.get("amount")
                item.difference = item.channel_amount
                item.status = ReconciliationStatus.MISMATCH
                item.issue_type = "channel_only"
                item.issue_description = "渠道有记录，但系统无记录"
                mismatch_count += 1
            
            elif system_txn and not channel_txn:
                item.order_no = system_txn.order_no
                item.transaction_no = system_txn.transaction_no
                item.channel_transaction_id = channel_id
                item.transaction_type = system_txn.transaction_type
                item.system_amount = system_txn.amount
                item.difference = system_txn.amount
                item.status = ReconciliationStatus.MISMATCH
                item.issue_type = "system_only"
                item.issue_description = "系统有记录，但渠道无记录"
                mismatch_count += 1
            
            item.created_at = datetime.utcnow()
            reconciliation_items.append(item)
        
        reconciliation = Reconciliation(
            reconciliation_no=reconciliation_no,
            channel=channel,
            reconciliation_date=datetime.combine(reconciliation_date, datetime.min.time()),
            total_channel_transactions=len(channel_txns_by_id),
            total_channel_amount=sum(t.get("amount", 0) for t in channel_bill_data),
            total_system_transactions=len(system_transactions),
            total_system_amount=sum(t.amount for t in system_transactions),
            matched_count=matched_count,
            mismatch_count=mismatch_count,
            status=ReconciliationStatus.MATCHED if mismatch_count == 0 else ReconciliationStatus.MISMATCH,
            raw_channel_data=json.dumps(channel_bill_data, ensure_ascii=False),
            processed_by=operator.id if operator else None,
            processed_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(reconciliation)
        db.flush()
        
        for item in reconciliation_items:
            item.reconciliation_id = reconciliation.id
            db.add(item)
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=operator.id if operator else None,
            operator_role=operator.role.value if operator and hasattr(operator.role, 'value') else "system",
            operator_name=operator.username if operator else "system",
            action_type="reconciliation",
            resource_type="reconciliation",
            resource_id=reconciliation.id,
            description=f"对账完成: {channel.value} {reconciliation_date}, 匹配: {matched_count}, 异常: {mismatch_count}",
            new_value=json.dumps({
                "reconciliation_no": reconciliation_no,
                "channel": channel.value,
                "reconciliation_date": reconciliation_date.isoformat(),
                "matched_count": matched_count,
                "mismatch_count": mismatch_count,
                "status": reconciliation.status.value if hasattr(reconciliation.status, 'value') else str(reconciliation.status)
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(reconciliation)
        
        return reconciliation
    
    @staticmethod
    def resolve_reconciliation_item(
        db: Session,
        item_id: int,
        resolution_remark: str,
        operator: User
    ) -> ReconciliationItem:
        
        item = db.query(ReconciliationItem).filter(ReconciliationItem.id == item_id).first()
        if not item:
            raise ValueError(f"Reconciliation item not found: {item_id}")
        
        item.status = ReconciliationStatus.RESOLVED
        item.resolution_remark = resolution_remark
        item.resolved_by = operator.id
        item.resolved_at = datetime.utcnow()
        
        reconciliation = db.query(Reconciliation).filter(
            Reconciliation.id == item.reconciliation_id
        ).first()
        
        if reconciliation:
            remaining_mismatch = db.query(ReconciliationItem).filter(
                ReconciliationItem.reconciliation_id == reconciliation.id,
                ReconciliationItem.status == ReconciliationStatus.MISMATCH
            ).count()
            
            if remaining_mismatch == 0:
                reconciliation.status = ReconciliationStatus.MATCHED
        
        audit_no = f"AUD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        audit_log = AuditLog(
            audit_no=audit_no,
            operator_id=operator.id,
            operator_role=operator.role.value if hasattr(operator.role, 'value') else str(operator.role),
            operator_name=operator.username,
            action_type="reconciliation_resolve",
            resource_type="reconciliation_item",
            resource_id=item.id,
            description=f"对账异常处理: {item.issue_description} -> {resolution_remark}",
            old_value=json.dumps({
                "status": "mismatch",
                "issue_type": item.issue_type,
                "issue_description": item.issue_description
            }, ensure_ascii=False),
            new_value=json.dumps({
                "status": "resolved",
                "resolution_remark": resolution_remark
            }, ensure_ascii=False),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(item)
        
        return item
    
    @staticmethod
    def get_reconciliation_detail(
        db: Session,
        reconciliation_no: str
    ) -> Dict[str, Any]:
        
        reconciliation = db.query(Reconciliation).filter(
            Reconciliation.reconciliation_no == reconciliation_no
        ).first()
        
        if not reconciliation:
            return {"error": "Reconciliation not found"}
        
        items = db.query(ReconciliationItem).filter(
            ReconciliationItem.reconciliation_id == reconciliation.id
        ).order_by(ReconciliationItem.created_at.asc()).all()
        
        return {
            "reconciliation": {
                "reconciliation_no": reconciliation.reconciliation_no,
                "channel": reconciliation.channel.value if hasattr(reconciliation.channel, 'value') else str(reconciliation.channel),
                "reconciliation_date": reconciliation.reconciliation_date.isoformat() if reconciliation.reconciliation_date else None,
                "total_channel_transactions": reconciliation.total_channel_transactions,
                "total_channel_amount": reconciliation.total_channel_amount,
                "total_system_transactions": reconciliation.total_system_transactions,
                "total_system_amount": reconciliation.total_system_amount,
                "matched_count": reconciliation.matched_count,
                "mismatch_count": reconciliation.mismatch_count,
                "status": reconciliation.status.value if hasattr(reconciliation.status, 'value') else str(reconciliation.status),
                "processed_at": reconciliation.processed_at.isoformat() if reconciliation.processed_at else None,
                "created_at": reconciliation.created_at.isoformat() if reconciliation.created_at else None
            },
            "items": [
                {
                    "id": item.id,
                    "order_no": item.order_no,
                    "transaction_no": item.transaction_no,
                    "channel_transaction_id": item.channel_transaction_id,
                    "transaction_type": item.transaction_type,
                    "system_amount": item.system_amount,
                    "channel_amount": item.channel_amount,
                    "difference": item.difference,
                    "status": item.status.value if hasattr(item.status, 'value') else str(item.status),
                    "issue_type": item.issue_type,
                    "issue_description": item.issue_description,
                    "resolution_remark": item.resolution_remark,
                    "resolved_by": item.resolved_by,
                    "resolved_at": item.resolved_at.isoformat() if item.resolved_at else None,
                    "created_at": item.created_at.isoformat() if item.created_at else None
                }
                for item in items
            ]
        }
    
    @staticmethod
    def get_adjustment_pool(
        db: Session,
        channel: PaymentChannel = None,
        status: ReconciliationStatus = None
    ) -> List[Dict[str, Any]]:
        
        query = db.query(ReconciliationItem).filter(
            ReconciliationItem.status.in_([ReconciliationStatus.MISMATCH])
        )
        
        if channel:
            query = query.join(Reconciliation).filter(
                Reconciliation.channel == channel
            )
        
        if status:
            query = query.filter(ReconciliationItem.status == status)
        
        items = query.order_by(ReconciliationItem.created_at.desc()).all()
        
        result = []
        for item in items:
            recon = db.query(Reconciliation).filter(
                Reconciliation.id == item.reconciliation_id
            ).first()
            
            result.append({
                "id": item.id,
                "reconciliation_no": recon.reconciliation_no if recon else None,
                "channel": recon.channel.value if recon and hasattr(recon.channel, 'value') else None,
                "order_no": item.order_no,
                "transaction_no": item.transaction_no,
                "channel_transaction_id": item.channel_transaction_id,
                "system_amount": item.system_amount,
                "channel_amount": item.channel_amount,
                "difference": item.difference,
                "issue_type": item.issue_type,
                "issue_description": item.issue_description,
                "status": item.status.value if hasattr(item.status, 'value') else str(item.status),
                "created_at": item.created_at.isoformat() if item.created_at else None
            })
        
        return result
