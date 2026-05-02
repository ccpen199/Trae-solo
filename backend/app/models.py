from datetime import datetime, date
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, DateTime, Date, Boolean, Text, ForeignKey, Numeric, Enum, Index
from sqlalchemy.orm import relationship
from app import Base


class RoleType(str, PyEnum):
    SUPPLIER = "supplier"
    CORE_ENTERPRISE = "core_enterprise"
    FINANCIAL_INSTITUTION = "financial_institution"
    RISK_CONTROL = "risk_control"
    FINANCE = "finance"
    ADMIN = "admin"


class OrderStatus(str, PyEnum):
    PENDING_ASSET_REGISTRATION = "pending_asset_registration"
    PENDING_CONFIRMATION = "pending_confirmation"
    PENDING_RISK_ASSESSMENT = "pending_risk_assessment"
    PENDING_LOAN = "pending_loan"
    PENDING_REPAYMENT = "pending_repayment"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    CLOSED = "closed"
    LOCKED = "locked"


class ActionType(str, PyEnum):
    CREATE = "create"
    SUBMIT = "submit"
    APPROVE = "approve"
    REJECT = "reject"
    RETURN = "return"
    RETRY = "retry"
    CANCEL = "cancel"
    CLOSE = "close"
    LOCK = "lock"
    UNLOCK = "unlock"
    LOAN = "loan"
    REPAY = "repay"
    REASSIGN = "reassign"
    SUPPLEMENT = "supplement"


class MessageStatus(str, PyEnum):
    PENDING = "pending"
    READ = "read"
    PROCESSED = "processed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"
    
    id = Column(String(50), primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(RoleType), nullable=False, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    email = Column(String(100))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="users")
    created_orders = relationship("MainOrder", back_populates="creator", foreign_keys="MainOrder.creator_id")
    assigned_orders = relationship("MainOrder", back_populates="assignee", foreign_keys="MainOrder.assignee_id")
    messages = relationship("TodoMessage", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    credits = relationship("Credit", back_populates="approver")
    loans = relationship("LoanDisbursement", back_populates="operator")
    repayments = relationship("Repayment", back_populates="operator")


class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    org_type = Column(Enum(RoleType), nullable=False, index=True)
    credit_code = Column(String(50), unique=True)
    legal_person = Column(String(50))
    address = Column(String(500))
    contact_person = Column(String(50))
    contact_phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    users = relationship("User", back_populates="organization")
    supplier_orders = relationship("MainOrder", back_populates="supplier_org", foreign_keys="MainOrder.supplier_id")
    core_orders = relationship("MainOrder", back_populates="core_org", foreign_keys="MainOrder.core_enterprise_id")
    finance_orders = relationship("MainOrder", back_populates="financial_org", foreign_keys="MainOrder.financial_institution_id")
    credits = relationship("Credit", back_populates="organization", foreign_keys="Credit.organization_id")
    finance_credits = relationship("Credit", back_populates="financial_institution", foreign_keys="Credit.financial_institution_id")
    receivables = relationship("AccountsReceivable", back_populates="organization", foreign_keys="AccountsReceivable.organization_id")
    debtor_receivables = relationship("AccountsReceivable", back_populates="debtor", foreign_keys="AccountsReceivable.debtor_id")


class MainOrder(Base):
    __tablename__ = "main_orders"
    
    id = Column(String(50), primary_key=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING_ASSET_REGISTRATION, index=True)
    
    supplier_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    core_enterprise_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    financial_institution_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    
    receivable_id = Column(String(50), ForeignKey("accounts_receivable.id"))
    trade_order_id = Column(String(50), ForeignKey("trade_orders.id"))
    confirmation_id = Column(String(50), ForeignKey("confirmations.id"))
    credit_id = Column(String(50), ForeignKey("credits.id"))
    loan_id = Column(String(50), ForeignKey("loan_disbursements.id"))
    repayment_id = Column(String(50), ForeignKey("repayments.id"))
    
    total_amount = Column(Numeric(18, 2), default=0)
    expected_completion_date = Column(Date)
    priority = Column(Integer, default=0)
    
    creator_id = Column(String(50), ForeignKey("users.id"))
    assignee_id = Column(String(50), ForeignKey("users.id"), index=True)
    
    is_locked = Column(Boolean, default=False)
    locked_by = Column(String(50))
    locked_at = Column(DateTime)
    lock_reason = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)
    
    supplier_org = relationship("Organization", back_populates="supplier_orders", foreign_keys=[supplier_id])
    core_org = relationship("Organization", back_populates="core_orders", foreign_keys=[core_enterprise_id])
    financial_org = relationship("Organization", back_populates="finance_orders", foreign_keys=[financial_institution_id])
    receivable = relationship("AccountsReceivable", back_populates="main_order")
    trade_order = relationship("TradeOrder", back_populates="main_order")
    confirmation = relationship("Confirmation", back_populates="main_order")
    credit = relationship("Credit", back_populates="main_order")
    loan = relationship("LoanDisbursement", back_populates="main_order")
    repayment = relationship("Repayment", back_populates="main_order")
    creator = relationship("User", back_populates="created_orders", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_orders", foreign_keys=[assignee_id])
    details = relationship("OrderDetail", back_populates="main_order", cascade="all, delete-orphan")
    messages = relationship("TodoMessage", back_populates="main_order", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="main_order", cascade="all, delete-orphan")
    ledger_entries = relationship("LedgerEntry", back_populates="main_order")


class TradeOrder(Base):
    __tablename__ = "trade_orders"
    
    id = Column(String(50), primary_key=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    
    supplier_id = Column(String(50), ForeignKey("organizations.id"))
    buyer_id = Column(String(50), ForeignKey("organizations.id"))
    
    trade_amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    
    order_date = Column(Date)
    delivery_date = Column(Date)
    payment_due_date = Column(Date)
    
    status = Column(String(50), default="active")
    description = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    main_order = relationship("MainOrder", back_populates="trade_order", uselist=False)
    receivables = relationship("AccountsReceivable", back_populates="trade_order")


class AccountsReceivable(Base):
    __tablename__ = "accounts_receivable"
    
    id = Column(String(50), primary_key=True)
    receivable_no = Column(String(50), unique=True, nullable=False, index=True)
    
    organization_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    trade_order_id = Column(String(50), ForeignKey("trade_orders.id"))
    
    amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    remaining_amount = Column(Numeric(18, 2), default=0)
    
    due_date = Column(Date)
    issue_date = Column(Date)
    
    debtor_name = Column(String(200))
    debtor_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    
    status = Column(String(50), default="pending_confirmation")
    is_confirmed = Column(Boolean, default=False)
    
    description = Column(Text)
    attachments = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="receivables", foreign_keys=[organization_id])
    debtor = relationship("Organization", back_populates="debtor_receivables", foreign_keys=[debtor_id])
    trade_order = relationship("TradeOrder", back_populates="receivables")
    main_order = relationship("MainOrder", back_populates="receivable", uselist=False)


class Confirmation(Base):
    __tablename__ = "confirmations"
    
    id = Column(String(50), primary_key=True)
    confirmation_no = Column(String(50), unique=True, nullable=False, index=True)
    
    receivable_id = Column(String(50), ForeignKey("accounts_receivable.id"), index=True)
    
    confirmer_id = Column(String(50), ForeignKey("users.id"))
    confirmer_org_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    
    confirmed_amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    
    is_confirmed = Column(Boolean, default=False)
    confirmation_date = Column(DateTime)
    
    rejection_reason = Column(String(500))
    comment = Column(Text)
    
    status = Column(String(50), default="pending")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    main_order = relationship("MainOrder", back_populates="confirmation", uselist=False)


class Credit(Base):
    __tablename__ = "credits"
    
    id = Column(String(50), primary_key=True)
    credit_no = Column(String(50), unique=True, nullable=False, index=True)
    
    organization_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    financial_institution_id = Column(String(50), ForeignKey("organizations.id"), index=True)
    
    total_amount = Column(Numeric(18, 2), default=0)
    used_amount = Column(Numeric(18, 2), default=0)
    available_amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    
    interest_rate = Column(Numeric(5, 4), default=Decimal("0.06"))
    term_days = Column(Integer, default=90)
    
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="medium")
    
    approver_id = Column(String(50), ForeignKey("users.id"))
    
    valid_from = Column(Date)
    valid_to = Column(Date)
    
    status = Column(String(50), default="active")
    comment = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="credits", foreign_keys=[organization_id])
    financial_institution = relationship("Organization", back_populates="finance_credits", foreign_keys=[financial_institution_id])
    approver = relationship("User", back_populates="credits")
    main_order = relationship("MainOrder", back_populates="credit", uselist=False)


class LoanDisbursement(Base):
    __tablename__ = "loan_disbursements"
    
    id = Column(String(50), primary_key=True)
    loan_no = Column(String(50), unique=True, nullable=False, index=True)
    
    credit_id = Column(String(50), ForeignKey("credits.id"), index=True)
    
    amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    
    interest_rate = Column(Numeric(5, 4), default=Decimal("0.06"))
    term_days = Column(Integer, default=90)
    maturity_date = Column(Date)
    
    operator_id = Column(String(50), ForeignKey("users.id"))
    
    disbursement_date = Column(DateTime)
    disbursement_account = Column(String(100))
    
    status = Column(String(50), default="pending")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    operator = relationship("User", back_populates="loans")
    main_order = relationship("MainOrder", back_populates="loan", uselist=False)


class Repayment(Base):
    __tablename__ = "repayments"
    
    id = Column(String(50), primary_key=True)
    repayment_no = Column(String(50), unique=True, nullable=False, index=True)
    
    loan_id = Column(String(50), ForeignKey("loan_disbursements.id"), index=True)
    
    principal_amount = Column(Numeric(18, 2), default=0)
    interest_amount = Column(Numeric(18, 2), default=0)
    penalty_amount = Column(Numeric(18, 2), default=0)
    total_amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    
    operator_id = Column(String(50), ForeignKey("users.id"))
    
    repayment_date = Column(DateTime)
    repayment_account = Column(String(100))
    
    is_settled = Column(Boolean, default=False)
    settlement_date = Column(DateTime)
    
    status = Column(String(50), default="pending")
    comment = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    operator = relationship("User", back_populates="repayments")
    main_order = relationship("MainOrder", back_populates="repayment", uselist=False)


class OrderDetail(Base):
    __tablename__ = "order_details"
    
    id = Column(String(50), primary_key=True)
    main_order_id = Column(String(50), ForeignKey("main_orders.id"), nullable=False, index=True)
    
    item_name = Column(String(200))
    item_code = Column(String(50))
    quantity = Column(Numeric(18, 4), default=0)
    unit_price = Column(Numeric(18, 2), default=0)
    amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    
    unit = Column(String(20))
    description = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    main_order = relationship("MainOrder", back_populates="details")


class TodoMessage(Base):
    __tablename__ = "todo_messages"
    
    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    main_order_id = Column(String(50), ForeignKey("main_orders.id"), index=True)
    
    title = Column(String(200), nullable=False)
    content = Column(Text)
    message_type = Column(String(50))
    
    status = Column(Enum(MessageStatus), default=MessageStatus.PENDING, index=True)
    
    action_required = Column(String(50))
    action_url = Column(String(500))
    
    priority = Column(Integer, default=0)
    deadline = Column(DateTime)
    
    read_at = Column(DateTime)
    processed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="messages")
    main_order = relationship("MainOrder", back_populates="messages")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(50), primary_key=True)
    main_order_id = Column(String(50), ForeignKey("main_orders.id"), index=True)
    user_id = Column(String(50), ForeignKey("users.id"))
    
    action = Column(Enum(ActionType), nullable=False, index=True)
    module = Column(String(50), index=True)
    
    from_status = Column(String(50))
    to_status = Column(String(50))
    
    message = Column(String(500))
    detail = Column(Text)
    ip_address = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="audit_logs")
    main_order = relationship("MainOrder", back_populates="audit_logs")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    
    id = Column(String(50), primary_key=True)
    main_order_id = Column(String(50), ForeignKey("main_orders.id"), index=True)
    
    ledger_type = Column(String(50), nullable=False, index=True)
    entry_type = Column(String(20), nullable=False)
    
    amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    
    account_from = Column(String(100))
    account_to = Column(String(100))
    
    reference_no = Column(String(50), index=True)
    business_type = Column(String(50))
    
    is_reconciled = Column(Boolean, default=False)
    reconciliation_date = Column(DateTime)
    
    status = Column(String(50), default="active")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    main_order = relationship("MainOrder", back_populates="ledger_entries")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(String(50), primary_key=True)
    main_order_id = Column(String(50), ForeignKey("main_orders.id"), unique=True, index=True)
    
    assessor_id = Column(String(50), ForeignKey("users.id"))
    
    credit_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="medium")
    
    approval_status = Column(String(50), default="pending")
    rejection_reason = Column(String(500))
    supplement_request = Column(Text)
    
    assigned_to = Column(String(50), ForeignKey("users.id"))
    
    assessment_date = Column(DateTime)
    comment = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TaxRule(Base):
    __tablename__ = "tax_rules"
    
    id = Column(String(50), primary_key=True)
    rule_code = Column(String(50), unique=True, nullable=False, index=True)
    rule_name = Column(String(200), nullable=False)
    
    tax_type = Column(String(50), index=True)
    tax_rate = Column(Numeric(5, 4), default=0)
    
    applicable_region = Column(String(100))
    applicable_business_type = Column(String(50))
    
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReconciliationEntry(Base):
    __tablename__ = "reconciliation_entries"
    
    id = Column(String(50), primary_key=True)
    reference_no = Column(String(50), index=True)
    main_order_id = Column(String(50), ForeignKey("main_orders.id"), index=True)
    
    system_amount = Column(Numeric(18, 2), default=0)
    external_amount = Column(Numeric(18, 2), default=0)
    difference = Column(Numeric(18, 2), default=0)
    
    status = Column(String(50), default="unmatched")
    resolution_type = Column(String(50))
    resolution_date = Column(DateTime)
    
    comment = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


Index('idx_main_order_status_updated', MainOrder.status, MainOrder.updated_at.desc())
Index('idx_message_user_status', TodoMessage.user_id, TodoMessage.status)
Index('idx_audit_order_created', AuditLog.main_order_id, AuditLog.created_at.desc())
