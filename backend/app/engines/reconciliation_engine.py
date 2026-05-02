from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import ReconciliationEntry, MainOrder, LedgerEntry


class ReconciliationStatus:
    MATCHED = "matched"
    UNMATCHED = "unmatched"
    RESOLVED = "resolved"
    PENDING_REVIEW = "pending_review"


class ResolutionType:
    WRITE_OFF = "write_off"
    ADDITION = "addition"
    REFUND = "refund"
    MANUAL_ADJUSTMENT = "manual_adjustment"


class ReconciliationEngine:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_entry(
        self,
        reference_no: str,
        system_amount: Decimal,
        external_amount: Decimal,
        main_order: Optional[MainOrder] = None
    ) -> ReconciliationEntry:
        difference = system_amount - external_amount
        
        if abs(difference) < Decimal("0.01"):
            status = ReconciliationStatus.MATCHED
        else:
            status = ReconciliationStatus.UNMATCHED
        
        entry = ReconciliationEntry(
            id=str(uuid4()),
            reference_no=reference_no,
            main_order_id=main_order.id if main_order else None,
            system_amount=system_amount,
            external_amount=external_amount,
            difference=difference,
            status=status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(entry)
        self.db.commit()
        return entry
    
    def compare_amounts(
        self,
        system_amount: Decimal,
        external_amount: Decimal,
        tolerance: Decimal = Decimal("0.01")
    ) -> Tuple[bool, Decimal]:
        difference = abs(system_amount - external_amount)
        matched = difference <= tolerance
        return matched, system_amount - external_amount
    
    def reconcile_order(
        self,
        main_order: MainOrder,
        external_amount: Decimal
    ) -> ReconciliationEntry:
        from app.engines.ledger_engine import LedgerEngine
        ledger_engine = LedgerEngine(self.db)
        
        summary = ledger_engine.get_ledger_summary(main_order)
        system_amount = summary["debit_total"]
        
        return self.create_entry(
            reference_no=main_order.order_no,
            system_amount=system_amount,
            external_amount=external_amount,
            main_order=main_order
        )
    
    def resolve_difference(
        self,
        entry: ReconciliationEntry,
        resolution_type: str,
        comment: str = None,
        operator_id: str = None
    ) -> ReconciliationEntry:
        entry.status = ReconciliationStatus.RESOLVED
        entry.resolution_type = resolution_type
        entry.resolution_date = datetime.utcnow()
        entry.comment = comment
        entry.updated_at = datetime.utcnow()
        
        self.db.commit()
        return entry
    
    def lock_order_for_reconciliation(
        self,
        main_order: MainOrder,
        reason: str = "对账处理中",
        locked_by: str = None
    ) -> MainOrder:
        if main_order.is_locked:
            raise ValueError(f"订单已被锁定: {main_order.order_no}")
        
        main_order.is_locked = True
        main_order.locked_by = locked_by
        main_order.locked_at = datetime.utcnow()
        main_order.lock_reason = reason
        main_order.updated_at = datetime.utcnow()
        
        self.db.commit()
        return main_order
    
    def unlock_order(
        self,
        main_order: MainOrder,
        unlocked_by: str = None
    ) -> MainOrder:
        main_order.is_locked = False
        main_order.locked_by = None
        main_order.locked_at = None
        main_order.lock_reason = None
        main_order.updated_at = datetime.utcnow()
        
        self.db.commit()
        return main_order
    
    def get_unmatched_entries(self, limit: int = 100) -> List[ReconciliationEntry]:
        return self.db.query(ReconciliationEntry).filter(
            ReconciliationEntry.status == ReconciliationStatus.UNMATCHED
        ).order_by(ReconciliationEntry.created_at.desc()).limit(limit).all()
    
    def get_pending_review_entries(self, limit: int = 100) -> List[ReconciliationEntry]:
        return self.db.query(ReconciliationEntry).filter(
            ReconciliationEntry.status == ReconciliationStatus.PENDING_REVIEW
        ).order_by(ReconciliationEntry.created_at.desc()).limit(limit).all()
    
    def get_reconciliation_summary(self, main_order: Optional[MainOrder] = None) -> Dict:
        query = self.db.query(ReconciliationEntry)
        
        if main_order:
            query = query.filter(ReconciliationEntry.main_order_id == main_order.id)
        
        entries = query.all()
        
        summary = {
            "total": len(entries),
            "matched": 0,
            "unmatched": 0,
            "resolved": 0,
            "pending_review": 0,
            "total_difference": Decimal(0),
            "by_resolution": {}
        }
        
        for entry in entries:
            if entry.status == ReconciliationStatus.MATCHED:
                summary["matched"] += 1
            elif entry.status == ReconciliationStatus.UNMATCHED:
                summary["unmatched"] += 1
            elif entry.status == ReconciliationStatus.RESOLVED:
                summary["resolved"] += 1
            elif entry.status == ReconciliationStatus.PENDING_REVIEW:
                summary["pending_review"] += 1
            
            summary["total_difference"] += abs(entry.difference)
            
            if entry.resolution_type:
                if entry.resolution_type not in summary["by_resolution"]:
                    summary["by_resolution"][entry.resolution_type] = 0
                summary["by_resolution"][entry.resolution_type] += 1
        
        summary["total_difference"] = float(summary["total_difference"])
        return summary
    
    def create_offset_entry(
        self,
        original_entry: ReconciliationEntry,
        offset_amount: Decimal,
        offset_reason: str
    ) -> Dict:
        return {
            "original_reference": original_entry.reference_no,
            "original_difference": float(original_entry.difference),
            "offset_amount": float(offset_amount),
            "offset_reason": offset_reason,
            "created_at": datetime.utcnow().isoformat()
        }
