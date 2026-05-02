from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import LedgerEntry, MainOrder


class LedgerType:
    RECEIVABLE = "receivable"
    PAYABLE = "payable"
    LOAN = "loan"
    CREDIT = "credit"
    REPAYMENT = "repayment"
    FEE = "fee"
    TAX = "tax"


class EntryType:
    DEBIT = "debit"
    CREDIT = "credit"


class LedgerEngine:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_entry(
        self,
        main_order: MainOrder,
        ledger_type: str,
        entry_type: str,
        amount: Decimal,
        account_from: str = None,
        account_to: str = None,
        reference_no: str = None,
        business_type: str = None
    ) -> LedgerEntry:
        entry = LedgerEntry(
            id=str(uuid4()),
            main_order_id=main_order.id,
            ledger_type=ledger_type,
            entry_type=entry_type,
            amount=amount,
            currency="CNY",
            account_from=account_from,
            account_to=account_to,
            reference_no=reference_no or main_order.order_no,
            business_type=business_type,
            status="active",
            created_at=datetime.utcnow()
        )
        self.db.add(entry)
        self.db.flush()
        return entry
    
    def record_receivable(
        self,
        main_order: MainOrder,
        amount: Decimal,
        debtor_account: str,
        creditor_account: str
    ) -> List[LedgerEntry]:
        entries = []
        entries.append(self.create_entry(
            main_order=main_order,
            ledger_type=LedgerType.RECEIVABLE,
            entry_type=EntryType.DEBIT,
            amount=amount,
            account_from=debtor_account,
            account_to=creditor_account,
            business_type="receivable_registration"
        ))
        self.db.commit()
        return entries
    
    def record_loan(
        self,
        main_order: MainOrder,
        loan_amount: Decimal,
        disbursement_account: str,
        receive_account: str
    ) -> List[LedgerEntry]:
        entries = []
        entries.append(self.create_entry(
            main_order=main_order,
            ledger_type=LedgerType.LOAN,
            entry_type=EntryType.DEBIT,
            amount=loan_amount,
            account_from=disbursement_account,
            account_to=receive_account,
            reference_no=main_order.loan.loan_no if main_order.loan else None,
            business_type="loan_disbursement"
        ))
        self.db.commit()
        return entries
    
    def record_repayment(
        self,
        main_order: MainOrder,
        principal: Decimal,
        interest: Decimal,
        penalty: Decimal,
        repayment_account: str,
        receive_account: str
    ) -> List[LedgerEntry]:
        entries = []
        total = principal + interest + penalty
        
        if principal > 0:
            entries.append(self.create_entry(
                main_order=main_order,
                ledger_type=LedgerType.REPAYMENT,
                entry_type=EntryType.CREDIT,
                amount=principal,
                account_from=repayment_account,
                account_to=receive_account,
                business_type="repayment_principal"
            ))
        
        if interest > 0:
            entries.append(self.create_entry(
                main_order=main_order,
                ledger_type=LedgerType.FEE,
                entry_type=EntryType.CREDIT,
                amount=interest,
                account_from=repayment_account,
                account_to=receive_account,
                business_type="repayment_interest"
            ))
        
        if penalty > 0:
            entries.append(self.create_entry(
                main_order=main_order,
                ledger_type=LedgerType.FEE,
                entry_type=EntryType.CREDIT,
                amount=penalty,
                account_from=repayment_account,
                account_to=receive_account,
                business_type="repayment_penalty"
            ))
        
        self.db.commit()
        return entries
    
    def get_ledger_summary(self, main_order: MainOrder) -> Dict:
        entries = self.db.query(LedgerEntry).filter(
            LedgerEntry.main_order_id == main_order.id
        ).all()
        
        summary = {
            "total_entries": len(entries),
            "by_type": {},
            "by_ledger": {},
            "debit_total": Decimal(0),
            "credit_total": Decimal(0)
        }
        
        for entry in entries:
            if entry.ledger_type not in summary["by_ledger"]:
                summary["by_ledger"][entry.ledger_type] = {
                    "debit": Decimal(0),
                    "credit": Decimal(0)
                }
            
            if entry.entry_type == EntryType.DEBIT:
                summary["by_ledger"][entry.ledger_type]["debit"] += entry.amount
                summary["debit_total"] += entry.amount
            else:
                summary["by_ledger"][entry.ledger_type]["credit"] += entry.amount
                summary["credit_total"] += entry.amount
            
            if entry.business_type:
                if entry.business_type not in summary["by_type"]:
                    summary["by_type"][entry.business_type] = Decimal(0)
                summary["by_type"][entry.business_type] += entry.amount
        
        return summary
    
    def validate_ledger_balance(self, main_order: MainOrder) -> bool:
        summary = self.get_ledger_summary(main_order)
        return summary["debit_total"] == summary["credit_total"]
