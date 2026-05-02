from datetime import datetime, date
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import Credit, MainOrder, User, Organization


class RiskLevel:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class CreditEngine:
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_risk_score(
        self,
        org: Organization,
        main_order: Optional[MainOrder] = None
    ) -> Tuple[int, str]:
        score = 50
        risk_factors = []
        
        if main_order:
            amount = main_order.total_amount
            if amount > Decimal("10000000"):
                score -= 15
                risk_factors.append("大额授信")
            elif amount > Decimal("5000000"):
                score -= 10
                risk_factors.append("较大额授信")
            
            if main_order.expected_completion_date:
                from datetime import date as Date
                today = Date.today()
                days_to_complete = (main_order.expected_completion_date - today).days
                if days_to_complete > 180:
                    score -= 10
                    risk_factors.append("期限较长")
                elif days_to_complete > 90:
                    score -= 5
                    risk_factors.append("期限适中")
        
        base_score = score
        score = max(10, min(100, score))
        
        if score >= 80:
            risk_level = RiskLevel.LOW
        elif score >= 60:
            risk_level = RiskLevel.MEDIUM
        elif score >= 40:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.VERY_HIGH
        
        return score, risk_level
    
    def create_credit(
        self,
        organization: Organization,
        financial_institution: Organization,
        total_amount: Decimal,
        approver: User,
        term_days: int = 90,
        interest_rate: Decimal = Decimal("0.06"),
        main_order: Optional[MainOrder] = None
    ) -> Credit:
        risk_score, risk_level = self.calculate_risk_score(
            organization, main_order
        )
        
        today = date.today()
        from datetime import timedelta
        valid_to = today + timedelta(days=term_days)
        
        credit_no = f"CRD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        credit = Credit(
            id=str(uuid4()),
            credit_no=credit_no,
            organization_id=organization.id,
            financial_institution_id=financial_institution.id,
            total_amount=total_amount,
            used_amount=Decimal(0),
            available_amount=total_amount,
            currency="CNY",
            interest_rate=interest_rate,
            term_days=term_days,
            risk_score=risk_score,
            risk_level=risk_level,
            approver_id=approver.id,
            valid_from=today,
            valid_to=valid_to,
            status="active",
            created_at=datetime.utcnow()
        )
        
        self.db.add(credit)
        self.db.flush()
        
        if main_order:
            main_order.credit_id = credit.id
            self.db.flush()
        
        self.db.commit()
        return credit
    
    def check_credit_availability(
        self,
        credit: Credit,
        request_amount: Decimal
    ) -> Tuple[bool, str]:
        if credit.status != "active":
            return False, f"授信状态无效: {credit.status}"
        
        if credit.valid_to and date.today() > credit.valid_to:
            return False, "授信已过期"
        
        if credit.available_amount < request_amount:
            return False, f"授信额度不足: 可用 {credit.available_amount}, 申请 {request_amount}"
        
        return True, "额度充足"
    
    def use_credit(
        self,
        credit: Credit,
        amount: Decimal,
        main_order: MainOrder
    ) -> Tuple[bool, str]:
        available, msg = self.check_credit_availability(credit, amount)
        if not available:
            return False, msg
        
        credit.used_amount += amount
        credit.available_amount -= amount
        
        if credit.available_amount < 0:
            credit.available_amount = Decimal(0)
        
        main_order.credit_id = credit.id
        self.db.flush()
        self.db.commit()
        
        return True, "额度使用成功"
    
    def release_credit(
        self,
        credit: Credit,
        amount: Decimal
    ) -> Tuple[bool, str]:
        if credit.used_amount < amount:
            return False, f"已使用额度不足: 已使用 {credit.used_amount}, 释放 {amount}"
        
        credit.used_amount -= amount
        credit.available_amount += amount
        
        if credit.used_amount < 0:
            credit.used_amount = Decimal(0)
        
        if credit.available_amount > credit.total_amount:
            credit.available_amount = credit.total_amount
        
        self.db.commit()
        return True, "额度释放成功"
    
    def get_organization_credits(
        self,
        organization_id: str
    ) -> List[Credit]:
        return self.db.query(Credit).filter(
            Credit.organization_id == organization_id,
            Credit.status == "active"
        ).all()
    
    def get_credit_summary(
        self,
        organization_id: str
    ) -> Dict:
        credits = self.get_organization_credits(organization_id)
        
        summary = {
            "total_credits": len(credits),
            "total_amount": Decimal(0),
            "total_used": Decimal(0),
            "total_available": Decimal(0),
            "avg_risk_score": 0,
            "by_risk_level": {}
        }
        
        if credits:
            total_score = 0
            for credit in credits:
                summary["total_amount"] += credit.total_amount
                summary["total_used"] += credit.used_amount
                summary["total_available"] += credit.available_amount
                total_score += credit.risk_score
                
                if credit.risk_level not in summary["by_risk_level"]:
                    summary["by_risk_level"][credit.risk_level] = {
                        "count": 0,
                        "amount": Decimal(0)
                    }
                summary["by_risk_level"][credit.risk_level]["count"] += 1
                summary["by_risk_level"][credit.risk_level]["amount"] += credit.total_amount
            
            summary["avg_risk_score"] = round(total_score / len(credits), 2)
        
        return summary
