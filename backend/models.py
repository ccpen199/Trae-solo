from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    MERCHANT_OPERATOR = "merchant_operator"
    MERCHANT_ADMIN = "merchant_admin"
    FINANCE = "finance"
    CHANNEL_OPERATOR = "channel_operator"
    ADMIN = "admin"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAYING = "paying"
    PAID = "paid"
    FAILED = "failed"
    REFUNDING = "refunding"
    REFUNDED = "refunded"
    CLOSED = "closed"

class PaymentChannel(str, enum.Enum):
    ALIPAY = "alipay"
    WECHAT = "wechat"
    UNIONPAY = "unionpay"
    CREDIT_CARD = "credit_card"

class ReconciliationStatus(str, enum.Enum):
    MATCHED = "matched"
    MISMATCH = "mismatch"
    PENDING = "pending"
    RESOLVED = "resolved"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=True)
    balance = Column(Float, default=0.0)
    frozen_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="users")
    orders = relationship("Order", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="operator")

class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_code = Column(String(50), unique=True, index=True, nullable=False)
    merchant_name = Column(String(100), nullable=False)
    contact_person = Column(String(50))
    contact_phone = Column(String(20))
    contact_email = Column(String(100))
    business_license = Column(String(255))
    settlement_account = Column(String(100))
    settlement_bank = Column(String(100))
    fee_rate = Column(Float, default=0.006)
    profit_sharing_ratio = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    frozen_balance = Column(Float, default=0.0)
    pending_settlement = Column(Float, default=0.0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    users = relationship("User", back_populates="merchant")
    orders = relationship("Order", back_populates="merchant")
    profit_sharings = relationship("ProfitSharing", back_populates="merchant")
    payouts = relationship("PayoutInstruction", back_populates="merchant")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(64), unique=True, index=True, nullable=False)
    merchant_order_no = Column(String(64), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    amount = Column(Float, nullable=False)
    fee_amount = Column(Float, default=0.0)
    channel = Column(SQLEnum(PaymentChannel), nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    subject = Column(String(255))
    body = Column(Text)
    client_ip = Column(String(50))
    notify_url = Column(String(500))
    return_url = Column(String(500))
    attach = Column(Text)
    prepay_id = Column(String(255))
    prepay_params = Column(Text)
    transaction_id = Column(String(64))
    bank_type = Column(String(50))
    settlement_date = Column(DateTime)
    paid_at = Column(DateTime)
    expired_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="orders")
    merchant = relationship("Merchant", back_populates="orders")
    transactions = relationship("PaymentTransaction", back_populates="order")
    refunds = relationship("Refund", back_populates="order")
    audit_logs = relationship("AuditLog", back_populates="order")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_no = Column(String(64), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    order_no = Column(String(64), index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    amount = Column(Float, nullable=False)
    fee_amount = Column(Float, default=0.0)
    channel = Column(SQLEnum(PaymentChannel), nullable=False)
    channel_transaction_id = Column(String(128))
    status = Column(String(20), default="pending")
    transaction_type = Column(String(20), default="payment")
    request_message = Column(Text)
    response_message = Column(Text)
    raw_request = Column(Text)
    raw_response = Column(Text)
    processed_by = Column(Integer, ForeignKey("users.id"))
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="transactions")

class ProfitSharing(Base):
    __tablename__ = "profit_sharings"
    
    id = Column(Integer, primary_key=True, index=True)
    sharing_no = Column(String(64), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"))
    order_no = Column(String(64), index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    transaction_no = Column(String(64))
    total_amount = Column(Float, nullable=False)
    merchant_amount = Column(Float, default=0.0)
    platform_fee = Column(Float, default=0.0)
    channel_fee = Column(Float, default=0.0)
    other_partners = Column(Text)
    status = Column(String(20), default="pending")
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="profit_sharings")

class PayoutInstruction(Base):
    __tablename__ = "payout_instructions"
    
    id = Column(Integer, primary_key=True, index=True)
    payout_no = Column(String(64), unique=True, index=True, nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    amount = Column(Float, nullable=False)
    bank_account = Column(String(100))
    bank_name = Column(String(100))
    account_name = Column(String(100))
    status = Column(String(20), default="pending")
    channel = Column(String(50))
    channel_batch_no = Column(String(64))
    channel_payout_id = Column(String(128))
    failure_reason = Column(String(500))
    processed_by = Column(Integer, ForeignKey("users.id"))
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="payouts")

class Reconciliation(Base):
    __tablename__ = "reconciliations"
    
    id = Column(Integer, primary_key=True, index=True)
    reconciliation_no = Column(String(64), unique=True, index=True, nullable=False)
    channel = Column(SQLEnum(PaymentChannel), nullable=False)
    reconciliation_date = Column(DateTime, nullable=False)
    total_channel_transactions = Column(Integer, default=0)
    total_channel_amount = Column(Float, default=0.0)
    total_system_transactions = Column(Integer, default=0)
    total_system_amount = Column(Float, default=0.0)
    matched_count = Column(Integer, default=0)
    mismatch_count = Column(Integer, default=0)
    status = Column(SQLEnum(ReconciliationStatus), default=ReconciliationStatus.PENDING)
    channel_file_url = Column(String(500))
    raw_channel_data = Column(Text)
    processed_by = Column(Integer, ForeignKey("users.id"))
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("ReconciliationItem", back_populates="reconciliation")

class ReconciliationItem(Base):
    __tablename__ = "reconciliation_items"
    
    id = Column(Integer, primary_key=True, index=True)
    reconciliation_id = Column(Integer, ForeignKey("reconciliations.id"), nullable=False)
    order_no = Column(String(64), index=True)
    transaction_no = Column(String(64))
    channel_transaction_id = Column(String(128))
    transaction_type = Column(String(20))
    system_amount = Column(Float)
    channel_amount = Column(Float)
    difference = Column(Float, default=0.0)
    status = Column(SQLEnum(ReconciliationStatus), default=ReconciliationStatus.PENDING)
    issue_type = Column(String(50))
    issue_description = Column(String(500))
    resolution_remark = Column(String(500))
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reconciliation = relationship("Reconciliation", back_populates="items")

class Refund(Base):
    __tablename__ = "refunds"
    
    id = Column(Integer, primary_key=True, index=True)
    refund_no = Column(String(64), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    order_no = Column(String(64), index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    refund_amount = Column(Float, nullable=False)
    refund_reason = Column(String(500))
    channel_refund_id = Column(String(128))
    status = Column(String(20), default="pending")
    processed_by = Column(Integer, ForeignKey("users.id"))
    processed_at = Column(DateTime)
    failure_reason = Column(String(500))
    request_message = Column(Text)
    response_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="refunds")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_no = Column(String(64), unique=True, index=True, nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator_role = Column(String(50))
    operator_name = Column(String(100))
    action_type = Column(String(50), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    order_id = Column(Integer, ForeignKey("orders.id"))
    order_no = Column(String(64))
    description = Column(String(500))
    old_value = Column(Text)
    new_value = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    operator = relationship("User", back_populates="audit_logs")
    order = relationship("Order", back_populates="audit_logs")

class IdempotentRecord(Base):
    __tablename__ = "idempotent_records"
    
    id = Column(Integer, primary_key=True, index=True)
    idempotent_key = Column(String(255), unique=True, index=True, nullable=False)
    business_type = Column(String(50), nullable=False)
    resource_id = Column(Integer)
    resource_no = Column(String(64))
    request_data = Column(Text)
    response_data = Column(Text)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

class ChannelBill(Base):
    __tablename__ = "channel_bills"
    
    id = Column(Integer, primary_key=True, index=True)
    bill_no = Column(String(64), unique=True, index=True, nullable=False)
    channel = Column(SQLEnum(PaymentChannel), nullable=False)
    bill_date = Column(DateTime, nullable=False)
    file_name = Column(String(255))
    file_path = Column(String(500))
    total_count = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    status = Column(String(20), default="downloaded")
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
