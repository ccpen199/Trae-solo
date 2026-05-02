from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import TaxRule, MainOrder


class TaxType:
    VAT = "vat"
    INCOME_TAX = "income_tax"
    STAMP_DUTY = "stamp_duty"
    WITHHOLDING_TAX = "withholding_tax"


class TaxEngine:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_applicable_rules(
        self,
        tax_type: str = None,
        region: str = None,
        business_type: str = None
    ) -> List[TaxRule]:
        query = self.db.query(TaxRule).filter(TaxRule.is_active == True)
        
        if tax_type:
            query = query.filter(TaxRule.tax_type == tax_type)
        
        if region:
            query = query.filter(TaxRule.applicable_region == region)
        
        if business_type:
            query = query.filter(TaxRule.applicable_business_type == business_type)
        
        return query.order_by(TaxRule.priority.desc()).all()
    
    def calculate_tax(
        self,
        amount: Decimal,
        tax_type: str,
        region: str = None,
        business_type: str = None
    ) -> Tuple[Decimal, List[Dict]]:
        rules = self.get_applicable_rules(tax_type, region, business_type)
        
        total_tax = Decimal(0)
        breakdown = []
        
        for rule in rules:
            tax_amount = amount * rule.tax_rate
            total_tax += tax_amount
            breakdown.append({
                "rule_code": rule.rule_code,
                "rule_name": rule.rule_name,
                "tax_type": rule.tax_type,
                "tax_rate": float(rule.tax_rate),
                "tax_amount": float(tax_amount),
                "base_amount": float(amount)
            })
        
        return total_tax, breakdown
    
    def calculate_all_taxes(
        self,
        amount: Decimal,
        region: str = None,
        business_type: str = None
    ) -> Dict:
        result = {
            "base_amount": float(amount),
            "total_tax": Decimal(0),
            "by_type": {},
            "breakdown": []
        }
        
        tax_types = [
            TaxType.VAT,
            TaxType.INCOME_TAX,
            TaxType.STAMP_DUTY,
            TaxType.WITHHOLDING_TAX
        ]
        
        for tax_type in tax_types:
            tax_amount, breakdown = self.calculate_tax(
                amount, tax_type, region, business_type
            )
            
            if tax_amount > 0:
                result["total_tax"] += tax_amount
                result["by_type"][tax_type] = {
                    "amount": float(tax_amount),
                    "details": breakdown
                }
                result["breakdown"].extend(breakdown)
        
        result["total_tax"] = float(result["total_tax"])
        result["total_amount"] = float(amount + Decimal(str(result["total_tax"])))
        
        return result
    
    def calculate_loan_interest(
        self,
        principal: Decimal,
        annual_rate: Decimal,
        days: int
    ) -> Decimal:
        daily_rate = annual_rate / Decimal(360)
        interest = principal * daily_rate * Decimal(days)
        return interest.quantize(Decimal("0.01"))
    
    def calculate_overdue_penalty(
        self,
        overdue_amount: Decimal,
        overdue_days: int,
        daily_rate: Decimal = Decimal("0.0005")
    ) -> Decimal:
        penalty = overdue_amount * daily_rate * Decimal(overdue_days)
        return penalty.quantize(Decimal("0.01"))
    
    def create_default_rules(self):
        existing_rules = self.db.query(TaxRule).first()
        if existing_rules:
            return
        
        default_rules = [
            {
                "rule_code": "VAT-001",
                "rule_name": "增值税-一般计税",
                "tax_type": TaxType.VAT,
                "tax_rate": Decimal("0.06"),
                "applicable_region": "CN",
                "applicable_business_type": "finance_service",
                "priority": 10
            },
            {
                "rule_code": "VAT-002",
                "rule_name": "增值税-小额计税",
                "tax_type": TaxType.VAT,
                "tax_rate": Decimal("0.03"),
                "applicable_region": "CN",
                "applicable_business_type": "small_scale",
                "priority": 5
            },
            {
                "rule_code": "STAMP-001",
                "rule_name": "印花税-借款合同",
                "tax_type": TaxType.STAMP_DUTY,
                "tax_rate": Decimal("0.00005"),
                "applicable_region": "CN",
                "applicable_business_type": "loan_contract",
                "priority": 10
            },
            {
                "rule_code": "WHT-001",
                "rule_name": "代扣代缴-利息",
                "tax_type": TaxType.WITHHOLDING_TAX,
                "tax_rate": Decimal("0.1"),
                "applicable_region": "CN",
                "applicable_business_type": "interest_income",
                "priority": 10
            }
        ]
        
        for rule_data in default_rules:
            rule = TaxRule(
                id=str(uuid4()),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                **rule_data
            )
            self.db.add(rule)
        
        self.db.commit()
