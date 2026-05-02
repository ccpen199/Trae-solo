from datetime import datetime, date
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models import (
    MainOrder, OrderStatus, OrderDetail, AccountsReceivable, TradeOrder,
    Confirmation, Credit, LoanDisbursement, Repayment, RiskAssessment,
    User, Organization, TodoMessage, MessageStatus, ActionType
)
from app.state_machine import StateMachine, MessageService
from app.engines import LedgerEngine, CreditEngine, TaxEngine, ReconciliationEngine


class OrderService:
    
    def __init__(self, db: Session):
        self.db = db
        self.state_machine = StateMachine(db)
        self.message_service = MessageService(db)
        self.ledger_engine = LedgerEngine(db)
        self.credit_engine = CreditEngine(db)
        self.tax_engine = TaxEngine(db)
        self.reconciliation_engine = ReconciliationEngine(db)
    
    def generate_order_no(self) -> str:
        today = datetime.now()
        date_str = today.strftime("%Y%m%d")
        prefix = f"SCF{date_str}"
        
        last_order = self.db.query(MainOrder).filter(
            MainOrder.order_no.like(f"{prefix}%")
        ).order_by(MainOrder.order_no.desc()).first()
        
        if last_order:
            last_no = last_order.order_no
            seq = int(last_no[-6:]) + 1
        else:
            seq = 1
        
        return f"{prefix}{seq:06d}"
    
    def validate_asset_registration(
        self,
        data: Dict,
        user: User
    ) -> Tuple[bool, List[str]]:
        errors = []
        
        required_fields = ["total_amount", "expected_completion_date"]
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f"字段必填: {field}")
        
        if "total_amount" in data:
            try:
                amount = Decimal(str(data["total_amount"]))
                if amount <= 0:
                    errors.append("金额必须大于0")
            except:
                errors.append("金额格式无效")
        
        if "expected_completion_date" in data:
            try:
                if isinstance(data["expected_completion_date"], str):
                    exp_date = date.fromisoformat(data["expected_completion_date"])
                else:
                    exp_date = data["expected_completion_date"]
                if exp_date < date.today():
                    errors.append("期望完成日期不能早于今天")
            except:
                errors.append("日期格式无效")
        
        existing = self.db.query(MainOrder).filter(
            MainOrder.status.in_([
                OrderStatus.PENDING_ASSET_REGISTRATION,
                OrderStatus.PENDING_CONFIRMATION,
                OrderStatus.PENDING_RISK_ASSESSMENT,
                OrderStatus.PENDING_LOAN,
                OrderStatus.PENDING_REPAYMENT
            ])
        ).first()
        
        return len(errors) == 0, errors
    
    def create_asset_registration(
        self,
        data: Dict,
        user: User
    ) -> Tuple[MainOrder, List]:
        valid, errors = self.validate_asset_registration(data, user)
        if not valid:
            raise ValueError(f"验证失败: {', '.join(errors)}")
        
        order_no = self.generate_order_no()
        
        exp_date = data.get("expected_completion_date")
        if isinstance(exp_date, str):
            exp_date = date.fromisoformat(exp_date)
        
        core_enterprise_id = data.get("core_enterprise_id")
        if not core_enterprise_id:
            core_org = self.db.query(Organization).filter(
                Organization.org_type == "core_enterprise"
            ).first()
            if core_org:
                core_enterprise_id = core_org.id
        
        fin_inst_id = data.get("financial_institution_id")
        if not fin_inst_id:
            fin_org = self.db.query(Organization).filter(
                Organization.org_type == "financial_institution"
            ).first()
            if fin_org:
                fin_inst_id = fin_org.id
        
        main_order = MainOrder(
            id=str(uuid4()),
            order_no=order_no,
            status=OrderStatus.PENDING_ASSET_REGISTRATION,
            supplier_id=user.org_id,
            core_enterprise_id=core_enterprise_id,
            financial_institution_id=fin_inst_id,
            total_amount=Decimal(str(data.get("total_amount", 0))),
            expected_completion_date=exp_date,
            creator_id=user.id,
            assignee_id=user.id,
            priority=data.get("priority", 0),
            is_locked=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(main_order)
        self.db.flush()
        
        trade_order = None
        if data.get("trade_order"):
            trade_data = data["trade_order"]
            trade_order = TradeOrder(
                id=str(uuid4()),
                order_no=trade_data.get("order_no", f"TO{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                supplier_id=user.org_id,
                buyer_id=core_enterprise_id,
                trade_amount=Decimal(str(trade_data.get("amount", data.get("total_amount", 0)))),
                order_date=date.today(),
                status="active",
                description=trade_data.get("description"),
                created_at=datetime.utcnow()
            )
            self.db.add(trade_order)
            self.db.flush()
            main_order.trade_order_id = trade_order.id
        
        receivable = AccountsReceivable(
            id=str(uuid4()),
            receivable_no=f"AR{datetime.now().strftime('%Y%m%d%H%M%S')}",
            organization_id=user.org_id,
            trade_order_id=trade_order.id if trade_order else None,
            amount=Decimal(str(data.get("total_amount", 0))),
            remaining_amount=Decimal(str(data.get("total_amount", 0))),
            issue_date=date.today(),
            debtor_id=core_enterprise_id,
            status="pending_confirmation",
            is_confirmed=False,
            description=data.get("description"),
            attachments=data.get("attachments"),
            created_at=datetime.utcnow()
        )
        self.db.add(receivable)
        self.db.flush()
        main_order.receivable_id = receivable.id
        
        details = data.get("details", [])
        created_details = []
        for i, detail in enumerate(details):
            qty = Decimal(str(detail.get("quantity", 0)))
            unit_price = Decimal(str(detail.get("unit_price", 0)))
            amount = qty * unit_price
            
            order_detail = OrderDetail(
                id=str(uuid4()),
                main_order_id=main_order.id,
                item_name=detail.get("item_name"),
                item_code=detail.get("item_code"),
                quantity=qty,
                unit_price=unit_price,
                amount=amount,
                unit=detail.get("unit"),
                description=detail.get("description"),
                created_at=datetime.utcnow()
            )
            self.db.add(order_detail)
            created_details.append(order_detail)
        
        self.db.commit()
        
        self.ledger_engine.record_receivable(
            main_order=main_order,
            amount=main_order.total_amount,
            debtor_account=f"ORG:{core_enterprise_id}",
            creditor_account=f"ORG:{user.org_id}"
        )
        
        return main_order, created_details
    
    def submit_asset_registration(
        self,
        order: MainOrder,
        user: User,
        comment: str = None
    ) -> MainOrder:
        old_status = order.status.value
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.SUBMIT,
            user=user,
            message="提交资产登记，等待核心企业确权",
            detail=comment
        )
        
        next_role = self.state_machine.get_next_assignee_role(order.status)
        if next_role:
            next_user = self.db.query(User).filter(
                User.org_id == order.core_enterprise_id,
                User.role == next_role,
                User.is_active == True
            ).first()
            
            if next_user:
                order.assignee_id = next_user.id
                self.db.commit()
                
                self.message_service.notify_status_change(
                    order=order,
                    old_status=old_status,
                    new_status=order.status.value,
                    target_user=next_user,
                    operator=user
                )
        
        return order
    
    def get_orders_for_user(
        self,
        user: User,
        status: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[MainOrder]:
        query = self.db.query(MainOrder)
        
        if user.role.value == "supplier":
            query = query.filter(MainOrder.supplier_id == user.org_id)
        elif user.role.value == "core_enterprise":
            query = query.filter(MainOrder.core_enterprise_id == user.org_id)
        elif user.role.value == "financial_institution":
            query = query.filter(MainOrder.financial_institution_id == user.org_id)
        elif user.role.value in ["risk_control", "finance"]:
            query = query.filter(
                or_(
                    MainOrder.assignee_id == user.id,
                    MainOrder.status.in_([
                        OrderStatus.PENDING_RISK_ASSESSMENT,
                        OrderStatus.PENDING_LOAN,
                        OrderStatus.PENDING_REPAYMENT
                    ])
                )
            )
        
        if status:
            query = query.filter(MainOrder.status == status)
        
        return query.order_by(MainOrder.created_at.desc()).offset(offset).limit(limit).all()
    
    def get_order_count_by_status(self, user: User) -> Dict:
        query = self.db.query(MainOrder)
        
        if user.role.value == "supplier":
            query = query.filter(MainOrder.supplier_id == user.org_id)
        elif user.role.value == "core_enterprise":
            query = query.filter(MainOrder.core_enterprise_id == user.org_id)
        
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
        
        result = {}
        for status in statuses:
            count = query.filter(MainOrder.status == status).count()
            result[status.value] = count
        
        return result
    
    def confirm_order(
        self,
        order: MainOrder,
        user: User,
        action: str,
        comment: str = None,
        rejection_reason: str = None
    ) -> MainOrder:
        old_status = order.status.value
        
        if action == "approve":
            order, audit_log = self.state_machine.execute_transition(
                order=order,
                action=ActionType.APPROVE,
                user=user,
                message="核心企业确权通过",
                detail=comment
            )
            
            confirmation = Confirmation(
                id=str(uuid4()),
                confirmation_no=f"CONF{datetime.now().strftime('%Y%m%d%H%M%S')}",
                receivable_id=order.receivable_id,
                confirmer_id=user.id,
                confirmer_org_id=user.org_id,
                confirmed_amount=order.total_amount,
                is_confirmed=True,
                confirmation_date=datetime.utcnow(),
                comment=comment,
                status="confirmed",
                created_at=datetime.utcnow()
            )
            self.db.add(confirmation)
            self.db.flush()
            order.confirmation_id = confirmation.id
            
            if order.receivable:
                order.receivable.is_confirmed = True
                order.receivable.status = "confirmed"
            
            self.db.commit()
        
        elif action == "return":
            order, audit_log = self.state_machine.execute_transition(
                order=order,
                action=ActionType.RETURN,
                user=user,
                message="确权退回供应商修改",
                detail=rejection_reason
            )
        
        elif action == "reject":
            order, audit_log = self.state_machine.execute_transition(
                order=order,
                action=ActionType.REJECT,
                user=user,
                message="核心企业确权拒绝",
                detail=rejection_reason
            )
        
        else:
            raise ValueError(f"未知操作: {action}")
        
        next_role = self.state_machine.get_next_assignee_role(order.status)
        if next_role:
            if next_role == "risk_control":
                next_user = self.db.query(User).filter(
                    User.role == next_role,
                    User.is_active == True
                ).first()
            else:
                next_user = self.db.query(User).filter(
                    User.org_id == order.supplier_id,
                    User.role == next_role,
                    User.is_active == True
                ).first()
            
            if next_user:
                order.assignee_id = next_user.id
                self.db.commit()
                
                self.message_service.notify_status_change(
                    order=order,
                    old_status=old_status,
                    new_status=order.status.value,
                    target_user=next_user,
                    operator=user
                )
        
        return order
    
    def risk_assessment(
        self,
        order: MainOrder,
        user: User,
        action: str,
        data: Dict = None
    ) -> MainOrder:
        old_status = order.status.value
        data = data or {}
        
        credit_score = data.get("credit_score", 60)
        risk_level = "medium"
        if credit_score >= 80:
            risk_level = "low"
        elif credit_score >= 60:
            risk_level = "medium"
        elif credit_score >= 40:
            risk_level = "high"
        else:
            risk_level = "very_high"
        
        if action == "approve":
            order, audit_log = self.state_machine.execute_transition(
                order=order,
                action=ActionType.APPROVE,
                user=user,
                message="风控评估通过",
                detail=data.get("comment")
            )
            
            assessment = RiskAssessment(
                id=str(uuid4()),
                main_order_id=order.id,
                assessor_id=user.id,
                credit_score=credit_score,
                risk_level=risk_level,
                approval_status="approved",
                assessment_date=datetime.utcnow(),
                comment=data.get("comment"),
                created_at=datetime.utcnow()
            )
            self.db.add(assessment)
            
            if order.financial_institution_id:
                fin_org = self.db.query(Organization).get(order.financial_institution_id)
                supplier_org = self.db.query(Organization).get(order.supplier_id)
                
                if fin_org and supplier_org:
                    try:
                        credit = self.credit_engine.create_credit(
                            organization=supplier_org,
                            financial_institution=fin_org,
                            total_amount=order.total_amount,
                            approver=user,
                            main_order=order
                        )
                    except Exception as e:
                        pass
        
        elif action == "reject":
            order, audit_log = self.state_machine.execute_transition(
                order=order,
                action=ActionType.REJECT,
                user=user,
                message="风控评估拒绝",
                detail=data.get("rejection_reason")
            )
            
            assessment = RiskAssessment(
                id=str(uuid4()),
                main_order_id=order.id,
                assessor_id=user.id,
                credit_score=credit_score,
                risk_level=risk_level,
                approval_status="rejected",
                rejection_reason=data.get("rejection_reason"),
                assessment_date=datetime.utcnow(),
                comment=data.get("comment"),
                created_at=datetime.utcnow()
            )
            self.db.add(assessment)
        
        elif action == "supplement":
            order, audit_log = self.state_machine.execute_transition(
                order=order,
                action=ActionType.SUPPLEMENT,
                user=user,
                message="要求补充资料",
                detail=data.get("supplement_request")
            )
            
            assessment = RiskAssessment(
                id=str(uuid4()),
                main_order_id=order.id,
                assessor_id=user.id,
                credit_score=credit_score,
                risk_level=risk_level,
                approval_status="pending",
                supplement_request=data.get("supplement_request"),
                assessment_date=datetime.utcnow(),
                comment=data.get("comment"),
                created_at=datetime.utcnow()
            )
            self.db.add(assessment)
        
        elif action == "reassign":
            new_assignee_id = data.get("assigned_to")
            if not new_assignee_id:
                raise ValueError("请指定转派对象")
            
            order, audit_log = self.state_machine.execute_transition(
                order=order,
                action=ActionType.REASSIGN,
                user=user,
                message=f"转派给用户: {new_assignee_id}",
                detail=data.get("comment")
            )
            order.assignee_id = new_assignee_id
        
        else:
            raise ValueError(f"未知操作: {action}")
        
        self.db.commit()
        
        next_role = self.state_machine.get_next_assignee_role(order.status)
        if next_role:
            next_user = self.db.query(User).filter(
                User.role == next_role,
                User.is_active == True
            ).first()
            
            if next_user:
                if action != "reassign":
                    order.assignee_id = next_user.id
                    self.db.commit()
                
                self.message_service.notify_status_change(
                    order=order,
                    old_status=old_status,
                    new_status=order.status.value,
                    target_user=next_user,
                    operator=user
                )
        
        return order
    
    def disburse_loan(
        self,
        order: MainOrder,
        user: User,
        data: Dict
    ) -> MainOrder:
        old_status = order.status.value
        
        amount = Decimal(str(data.get("amount", order.total_amount)))
        account = data.get("disbursement_account", "DEFAULT")
        
        if order.credit_id:
            credit = self.db.query(Credit).get(order.credit_id)
            if credit:
                available, msg = self.credit_engine.check_credit_availability(credit, amount)
                if not available:
                    raise ValueError(msg)
                
                self.credit_engine.use_credit(credit, amount, order)
        
        loan = LoanDisbursement(
            id=str(uuid4()),
            loan_no=f"LN{datetime.now().strftime('%Y%m%d%H%M%S')}",
            credit_id=order.credit_id,
            amount=amount,
            interest_rate=Decimal(str(data.get("interest_rate", "0.06"))),
            term_days=data.get("term_days", 90),
            operator_id=user.id,
            disbursement_date=datetime.utcnow(),
            disbursement_account=account,
            status="disbursed",
            created_at=datetime.utcnow()
        )
        self.db.add(loan)
        self.db.flush()
        order.loan_id = loan.id
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.LOAN,
            user=user,
            message=f"放款成功: {amount} CNY",
            detail=data.get("comment")
        )
        
        self.ledger_engine.record_loan(
            main_order=order,
            loan_amount=amount,
            disbursement_account=f"FIN:{order.financial_institution_id}",
            receive_account=f"SUPP:{order.supplier_id}"
        )
        
        self.db.commit()
        
        next_role = self.state_machine.get_next_assignee_role(order.status)
        if next_role:
            next_user = self.db.query(User).filter(
                User.role == next_role,
                User.is_active == True
            ).first()
            
            if next_user:
                order.assignee_id = next_user.id
                self.db.commit()
                
                self.message_service.notify_status_change(
                    order=order,
                    old_status=old_status,
                    new_status=order.status.value,
                    target_user=next_user,
                    operator=user
                )
        
        return order
    
    def process_repayment(
        self,
        order: MainOrder,
        user: User,
        data: Dict
    ) -> MainOrder:
        old_status = order.status.value
        
        if order.is_locked:
            pass
        
        principal = Decimal(str(data.get("principal_amount", order.total_amount)))
        interest = Decimal(str(data.get("interest_amount", 0)))
        penalty = Decimal(str(data.get("penalty_amount", 0)))
        total = principal + interest + penalty
        
        account = data.get("repayment_account", "DEFAULT")
        
        repayment = Repayment(
            id=str(uuid4()),
            repayment_no=f"RP{datetime.now().strftime('%Y%m%d%H%M%S')}",
            loan_id=order.loan_id,
            principal_amount=principal,
            interest_amount=interest,
            penalty_amount=penalty,
            total_amount=total,
            operator_id=user.id,
            repayment_date=datetime.utcnow(),
            repayment_account=account,
            is_settled=True,
            settlement_date=datetime.utcnow(),
            status="settled",
            comment=data.get("comment"),
            created_at=datetime.utcnow()
        )
        self.db.add(repayment)
        self.db.flush()
        order.repayment_id = repayment.id
        
        if order.credit_id:
            credit = self.db.query(Credit).get(order.credit_id)
            if credit:
                self.credit_engine.release_credit(credit, principal)
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.REPAY,
            user=user,
            message=f"回款核销成功: 本金 {principal}, 利息 {interest}, 罚息 {penalty}",
            detail=data.get("comment")
        )
        
        self.ledger_engine.record_repayment(
            main_order=order,
            principal=principal,
            interest=interest,
            penalty=penalty,
            repayment_account=f"SUPP:{order.supplier_id}",
            receive_account=f"FIN:{order.financial_institution_id}"
        )
        
        self.db.commit()
        
        if order.creator_id:
            creator = self.db.query(User).get(order.creator_id)
            if creator:
                self.message_service.notify_status_change(
                    order=order,
                    old_status=old_status,
                    new_status=order.status.value,
                    target_user=creator,
                    operator=user
                )
        
        return order
    
    def lock_order(
        self,
        order: MainOrder,
        user: User,
        reason: str = None
    ) -> MainOrder:
        if order.is_locked:
            raise ValueError(f"订单已锁定: {order.order_no}")
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.LOCK,
            user=user,
            message="锁定订单",
            detail=reason or "资金异常处理中"
        )
        
        order.is_locked = True
        order.locked_by = user.id
        order.locked_at = datetime.utcnow()
        order.lock_reason = reason or "资金异常处理中"
        order.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return order
    
    def unlock_order(
        self,
        order: MainOrder,
        user: User
    ) -> MainOrder:
        if not order.is_locked:
            raise ValueError(f"订单未锁定: {order.order_no}")
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.UNLOCK,
            user=user,
            message="解锁订单",
            detail="异常处理完成"
        )
        
        order.is_locked = False
        order.locked_by = None
        order.locked_at = None
        order.lock_reason = None
        order.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return order
    
    def retry_order(
        self,
        order: MainOrder,
        user: User,
        comment: str = None
    ) -> MainOrder:
        old_status = order.status.value
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.RETRY,
            user=user,
            message="重新提交",
            detail=comment
        )
        
        self.db.commit()
        
        if order.creator_id:
            creator = self.db.query(User).get(order.creator_id)
            if creator:
                self.message_service.notify_status_change(
                    order=order,
                    old_status=old_status,
                    new_status=order.status.value,
                    target_user=creator,
                    operator=user
                )
        
        return order
    
    def close_order(
        self,
        order: MainOrder,
        user: User,
        comment: str = None
    ) -> MainOrder:
        old_status = order.status.value
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.CLOSE,
            user=user,
            message="关闭订单",
            detail=comment
        )
        
        for msg in order.messages:
            if msg.status == MessageStatus.PENDING:
                self.message_service.cancel_message(msg)
        
        self.db.commit()
        
        return order
    
    def cancel_order(
        self,
        order: MainOrder,
        user: User,
        comment: str = None
    ) -> MainOrder:
        old_status = order.status.value
        
        order, audit_log = self.state_machine.execute_transition(
            order=order,
            action=ActionType.CANCEL,
            user=user,
            message="撤销订单",
            detail=comment
        )
        
        for msg in order.messages:
            if msg.status == MessageStatus.PENDING:
                self.message_service.cancel_message(msg)
        
        self.db.commit()
        
        return order
