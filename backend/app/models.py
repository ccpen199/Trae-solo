from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    APPLICANT = "applicant"
    BUYER = "buyer"
    APPROVER = "approver"
    SUPPLIER = "supplier"
    FINANCE = "finance"
    ADMIN = "admin"


class PurchaseStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING_ORDER = "pending_order"
    ORDERED = "ordered"
    RECEIVING = "receiving"
    RECEIVED = "received"
    PENDING_SETTLEMENT = "pending_settlement"
    SETTLED = "settled"
    ARCHIVED = "archived"
    CANCELLED = "cancelled"


class ApprovalAction(str, enum.Enum):
    APPROVE = "approve"
    REJECT = "reject"
    SUPPLEMENT = "supplement"
    REASSIGN = "reassign"


class MessageType(str, enum.Enum):
    TODO = "todo"
    NOTIFICATION = "notification"
    ALERT = "alert"


class MessageStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    DONE = "done"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.APPLICANT)
    email = Column(String(100))
    phone = Column(String(20))
    department = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    created_purchases = relationship("PurchaseOrder", back_populates="creator", foreign_keys="PurchaseOrder.created_by")
    responsible_purchases = relationship("PurchaseOrder", back_populates="responsible_user", foreign_keys="PurchaseOrder.responsible_user_id")
    approvals = relationship("ApprovalRecord", back_populates="approver")
    messages = relationship("Message", back_populates="user")
    operation_logs = relationship("OperationLog", back_populates="operator")


class ProductCategory(Base):
    __tablename__ = "product_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("product_categories.id"))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    products = relationship("Product", back_populates="category")


class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(500))
    tax_number = Column(String(50))
    bank_account = Column(String(100))
    bank_name = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    products = relationship("Product", back_populates="supplier")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("product_categories.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    specification = Column(String(500))
    unit = Column(String(20))
    unit_price = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.13)
    description = Column(Text)
    image_url = Column(String(500))
    stock_quantity = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("ProductCategory", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    purchase_items = relationship("PurchaseItem", back_populates="product")


class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(200), nullable=False)
    department = Column(String(100))
    fiscal_year = Column(Integer)
    category = Column(String(100))
    total_amount = Column(Float, default=0.0)
    used_amount = Column(Float, default=0.0)
    reserved_amount = Column(Float, default=0.0)
    available_amount = Column(Float, default=0.0)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def available(self):
        return self.total_amount - self.used_amount - self.reserved_amount


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    responsible_user_id = Column(Integer, ForeignKey("users.id"))
    department = Column(String(100))
    budget_id = Column(Integer, ForeignKey("budgets.id"))
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount_with_tax = Column(Float, default=0.0)
    status = Column(SQLEnum(PurchaseStatus), default=PurchaseStatus.DRAFT)
    current_approval_node = Column(String(100))
    expected_completion_date = Column(DateTime)
    attachments = Column(Text)
    is_locked = Column(Boolean, default=False)
    lock_reason = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = Column(DateTime)
    approved_at = Column(DateTime)
    received_at = Column(DateTime)
    settled_at = Column(DateTime)
    
    creator = relationship("User", back_populates="created_purchases", foreign_keys=[created_by])
    responsible_user = relationship("User", back_populates="responsible_purchases", foreign_keys=[responsible_user_id])
    items = relationship("PurchaseItem", back_populates="order", cascade="all, delete-orphan")
    approval_records = relationship("ApprovalRecord", back_populates="order", cascade="all, delete-orphan")
    receipt_records = relationship("ReceiptRecord", back_populates="order", cascade="all, delete-orphan")
    settlement_records = relationship("SettlementRecord", back_populates="order", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="purchase_order")
    operation_logs = relationship("OperationLog", back_populates="order")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    product_name = Column(String(200), nullable=False)
    product_code = Column(String(50))
    specification = Column(String(500))
    unit = Column(String(20))
    quantity = Column(Float, default=0.0)
    unit_price = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.13)
    amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    amount_with_tax = Column(Float, default=0.0)
    received_quantity = Column(Float, default=0.0)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", back_populates="purchase_items")


class ApprovalNode(Base):
    __tablename__ = "approval_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    node_code = Column(String(50), unique=True, index=True)
    node_name = Column(String(100), nullable=False)
    approval_role = Column(SQLEnum(UserRole))
    approval_user_id = Column(Integer, ForeignKey("users.id"))
    min_amount = Column(Float, default=0.0)
    max_amount = Column(Float)
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ApprovalRecord(Base):
    __tablename__ = "approval_records"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    node_code = Column(String(50))
    node_name = Column(String(100))
    approver_id = Column(Integer, ForeignKey("users.id"))
    action = Column(SQLEnum(ApprovalAction))
    opinion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("PurchaseOrder", back_populates="approval_records")
    approver = relationship("User", back_populates="approvals")


class ReceiptRecord(Base):
    __tablename__ = "receipt_records"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    receipt_no = Column(String(50), unique=True, index=True)
    received_by = Column(Integer, ForeignKey("users.id"))
    total_quantity = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    remark = Column(Text)
    attachments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("PurchaseOrder", back_populates="receipt_records")
    items = relationship("ReceiptItem", back_populates="receipt", cascade="all, delete-orphan")


class ReceiptItem(Base):
    __tablename__ = "receipt_items"
    
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipt_records.id"))
    purchase_item_id = Column(Integer, ForeignKey("purchase_items.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    product_name = Column(String(200))
    quantity = Column(Float, default=0.0)
    unit_price = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    receipt = relationship("ReceiptRecord", back_populates="items")


class SettlementRecord(Base):
    __tablename__ = "settlement_records"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    settlement_no = Column(String(50), unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount_with_tax = Column(Float, default=0.0)
    invoice_no = Column(String(100))
    payment_method = Column(String(50))
    bank_account = Column(String(100))
    bank_name = Column(String(200))
    status = Column(String(50), default="pending")
    remark = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("PurchaseOrder", back_populates="settlement_records")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    message_type = Column(SQLEnum(MessageType), default=MessageType.TODO)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    status = Column(SQLEnum(MessageStatus), default=MessageStatus.UNREAD)
    action_url = Column(String(500))
    read_at = Column(DateTime)
    done_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="messages")
    purchase_order = relationship("PurchaseOrder", back_populates="messages")


class OperationLog(Base):
    __tablename__ = "operation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    operator_id = Column(Integer, ForeignKey("users.id"))
    operation = Column(String(100), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    remark = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("PurchaseOrder", back_populates="operation_logs")
    operator = relationship("User", back_populates="operation_logs")
