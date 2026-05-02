from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models import (
    MainOrder, OrderStatus, AuditLog, ActionType, LedgerEntry,
    Credit, ReconciliationEntry, User, Organization, RoleType
)


class ReportService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_stats(self, user: User) -> Dict:
        result = {
            "orders_by_status": {},
            "total_amount_by_status": {},
            "pending_count": 0,
            "total_amount": Decimal(0),
            "recent_activities": [],
            "risk_summary": {}
        }
        
        query = self.db.query(MainOrder)
        
        if user.role.value == "supplier":
            query = query.filter(MainOrder.supplier_id == user.org_id)
        elif user.role.value == "core_enterprise":
            query = query.filter(MainOrder.core_enterprise_id == user.org_id)
        elif user.role.value == "financial_institution":
            query = query.filter(MainOrder.financial_institution_id == user.org_id)
        
        statuses = [
            OrderStatus.PENDING_ASSET_REGISTRATION,
            OrderStatus.PENDING_CONFIRMATION,
            OrderStatus.PENDING_RISK_ASSESSMENT,
            OrderStatus.PENDING_LOAN,
            OrderStatus.PENDING_REPAYMENT,
            OrderStatus.COMPLETED,
            OrderStatus.REJECTED,
            OrderStatus.CANCELLED,
            OrderStatus.CLOSED,
            OrderStatus.LOCKED,
        ]
        
        for status in statuses:
            count = query.filter(MainOrder.status == status).count()
            result["orders_by_status"][status.value] = count
            
            if status in [
                OrderStatus.PENDING_ASSET_REGISTRATION,
                OrderStatus.PENDING_CONFIRMATION,
                OrderStatus.PENDING_RISK_ASSESSMENT,
                OrderStatus.PENDING_LOAN,
                OrderStatus.PENDING_REPAYMENT
            ]:
                result["pending_count"] += count
            
            amount_result = query.filter(MainOrder.status == status).with_entities(
                func.sum(MainOrder.total_amount)
            ).scalar()
            result["total_amount_by_status"][status.value] = float(
                amount_result or Decimal(0)
            )
        
        total_result = query.with_entities(
            func.sum(MainOrder.total_amount)
        ).scalar()
        result["total_amount"] = float(total_result or Decimal(0))
        
        recent_logs = self.db.query(AuditLog).filter(
            AuditLog.user_id == user.id
        ).order_by(AuditLog.created_at.desc()).limit(10).all()
        
        result["recent_activities"] = [
            {
                "id": log.id,
                "action": log.action.value if log.action else None,
                "module": log.module,
                "from_status": log.from_status,
                "to_status": log.to_status,
                "message": log.message,
                "main_order_id": log.main_order_id,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in recent_logs
        ]
        
        credit_query = self.db.query(Credit).filter(
            Credit.status == "active"
        )
        
        if user.role.value == "supplier":
            credit_query = credit_query.filter(Credit.organization_id == user.org_id)
        
        credit_result = credit_query.with_entities(
            func.count(Credit.id),
            func.sum(Credit.total_amount),
            func.sum(Credit.used_amount),
            func.sum(Credit.available_amount)
        ).first()
        
        result["risk_summary"] = {
            "credit_count": credit_result[0] or 0,
            "total_credit": float(credit_result[1] or Decimal(0)),
            "used_credit": float(credit_result[2] or Decimal(0)),
            "available_credit": float(credit_result[3] or Decimal(0))
        }
        
        return result
    
    def get_order_processing_report(
        self,
        user: User,
        start_date: date = None,
        end_date: date = None
    ) -> Dict:
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        query = self.db.query(MainOrder).filter(
            MainOrder.created_at >= datetime.combine(start_date, datetime.min.time()),
            MainOrder.created_at <= datetime.combine(end_date, datetime.max.time())
        )
        
        if user.role.value == "supplier":
            query = query.filter(MainOrder.supplier_id == user.org_id)
        elif user.role.value == "core_enterprise":
            query = query.filter(MainOrder.core_enterprise_id == user.org_id)
        
        orders = query.all()
        
        result = {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_orders": len(orders),
                "total_amount": 0,
                "completed_count": 0,
                "completed_amount": 0,
                "rejected_count": 0,
                "avg_processing_days": 0
            },
            "by_status": {},
            "conversion_analysis": {},
            "daily_trend": []
        }
        
        total_days = 0
        completed_count = 0
        
        for order in orders:
            result["summary"]["total_amount"] += float(order.total_amount)
            
            if order.status == OrderStatus.COMPLETED:
                result["summary"]["completed_count"] += 1
                result["summary"]["completed_amount"] += float(order.total_amount)
                if order.created_at and order.completed_at:
                    processing_days = (order.completed_at - order.created_at).days
                    total_days += processing_days
                    completed_count += 1
            
            if order.status == OrderStatus.REJECTED:
                result["summary"]["rejected_count"] += 1
            
            status_key = order.status.value
            if status_key not in result["by_status"]:
                result["by_status"][status_key] = {"count": 0, "amount": 0}
            result["by_status"][status_key]["count"] += 1
            result["by_status"][status_key]["amount"] += float(order.total_amount)
        
        if completed_count > 0:
            result["summary"]["avg_processing_days"] = round(total_days / completed_count, 1)
        
        total_pending = (
            result["by_status"].get(OrderStatus.PENDING_ASSET_REGISTRATION.value, {}).get("count", 0) +
            result["by_status"].get(OrderStatus.PENDING_CONFIRMATION.value, {}).get("count", 0) +
            result["by_status"].get(OrderStatus.PENDING_RISK_ASSESSMENT.value, {}).get("count", 0) +
            result["by_status"].get(OrderStatus.PENDING_LOAN.value, {}).get("count", 0) +
            result["by_status"].get(OrderStatus.PENDING_REPAYMENT.value, {}).get("count", 0)
        )
        
        if result["summary"]["total_orders"] > 0:
            result["conversion_analysis"] = {
                "completion_rate": round(result["summary"]["completed_count"] / result["summary"]["total_orders"] * 100, 2),
                "rejection_rate": round(result["summary"]["rejected_count"] / result["summary"]["total_orders"] * 100, 2),
                "pending_rate": round(total_pending / result["summary"]["total_orders"] * 100, 2)
            }
        
        result["summary"]["total_amount"] = round(result["summary"]["total_amount"], 2)
        result["summary"]["completed_amount"] = round(result["summary"]["completed_amount"], 2)
        
        return result
    
    def get_risk_report(
        self,
        user: User
    ) -> Dict:
        result = {
            "credit_risk": {
                "by_level": {},
                "avg_score": 0
            },
            "reconciliation_issues": {},
            "locked_orders": 0
        }
        
        credit_query = self.db.query(Credit).filter(Credit.status == "active")
        credits = credit_query.all()
        
        if credits:
            total_score = 0
            for credit in credits:
                level = credit.risk_level
                if level not in result["credit_risk"]["by_level"]:
                    result["credit_risk"]["by_level"][level] = {
                        "count": 0,
                        "total_amount": 0
                    }
                result["credit_risk"]["by_level"][level]["count"] += 1
                result["credit_risk"]["by_level"][level]["total_amount"] += float(credit.total_amount)
                total_score += credit.risk_score
            
            result["credit_risk"]["avg_score"] = round(total_score / len(credits), 1)
        
        recon_query = self.db.query(ReconciliationEntry).filter(
            ReconciliationEntry.status == "unmatched"
        )
        unmatched = recon_query.count()
        total_diff = recon_query.with_entities(
            func.sum(func.abs(ReconciliationEntry.difference))
        ).scalar()
        
        result["reconciliation_issues"] = {
            "unmatched_count": unmatched,
            "total_difference": float(total_diff or Decimal(0))
        }
        
        result["locked_orders"] = self.db.query(MainOrder).filter(
            MainOrder.is_locked == True
        ).count()
        
        return result
    
    def get_audit_trail(
        self,
        main_order_id: str = None,
        user_id: str = None,
        limit: int = 100
    ) -> List[Dict]:
        query = self.db.query(AuditLog)
        
        if main_order_id:
            query = query.filter(AuditLog.main_order_id == main_order_id)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": log.id,
                "main_order_id": log.main_order_id,
                "user_id": log.user_id,
                "action": log.action.value if log.action else None,
                "module": log.module,
                "from_status": log.from_status,
                "to_status": log.to_status,
                "message": log.message,
                "detail": log.detail,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ]
    
    def get_ledger_report(
        self,
        main_order_id: str = None,
        limit: int = 100
    ) -> Dict:
        query = self.db.query(LedgerEntry)
        
        if main_order_id:
            query = query.filter(LedgerEntry.main_order_id == main_order_id)
        
        entries = query.order_by(LedgerEntry.created_at.desc()).limit(limit).all()
        
        result = {
            "total_entries": len(entries),
            "by_ledger_type": {},
            "debit_total": 0,
            "credit_total": 0,
            "entries": []
        }
        
        for entry in entries:
            if entry.entry_type == "debit":
                result["debit_total"] += float(entry.amount)
            else:
                result["credit_total"] += float(entry.amount)
            
            ledger_type = entry.ledger_type
            if ledger_type not in result["by_ledger_type"]:
                result["by_ledger_type"][ledger_type] = {
                    "count": 0,
                    "debit": 0,
                    "credit": 0
                }
            result["by_ledger_type"][ledger_type]["count"] += 1
            
            if entry.entry_type == "debit":
                result["by_ledger_type"][ledger_type]["debit"] += float(entry.amount)
            else:
                result["by_ledger_type"][ledger_type]["credit"] += float(entry.amount)
            
            result["entries"].append({
                "id": entry.id,
                "main_order_id": entry.main_order_id,
                "ledger_type": entry.ledger_type,
                "entry_type": entry.entry_type,
                "amount": float(entry.amount),
                "currency": entry.currency,
                "account_from": entry.account_from,
                "account_to": entry.account_to,
                "reference_no": entry.reference_no,
                "business_type": entry.business_type,
                "is_reconciled": entry.is_reconciled,
                "status": entry.status,
                "created_at": entry.created_at.isoformat() if entry.created_at else None
            })
        
        result["debit_total"] = round(result["debit_total"], 2)
        result["credit_total"] = round(result["credit_total"], 2)
        
        return result
