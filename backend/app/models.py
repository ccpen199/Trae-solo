from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text,
    ForeignKey, Index, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.database import Base


class UserRole(str, Enum):
    PUBLISHER = "publisher"
    WORKER = "worker"
    EXPERT = "expert"
    ADMIN = "admin"


class TaskStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    PENDING_REVIEW = "pending_review"
    REVIEWING = "reviewing"
    QUALIFIED = "qualified"
    DISQUALIFIED = "disqualified"
    APPEALING = "appealing"
    SETTLED = "settled"


class ReviewResult(str, Enum):
    PENDING = "pending"
    QUALIFIED = "qualified"
    DISQUALIFIED = "disqualified"


class AppealStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CheatingRiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20))
    real_name = Column(String(50))
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    level = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    wallet = relationship("Wallet", back_populates="user", uselist=False)
    published_batches = relationship("TaskBatch", back_populates="publisher")
    assigned_tasks = relationship("TaskAssignment", back_populates="worker")
    reviews = relationship("ExpertReview", back_populates="expert")
    appeals = relationship("Appeal", back_populates="requester", foreign_keys="Appeal.requester_id")
    operations = relationship("OperationTrace", back_populates="user")


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Float, default=0.0)
    total_income = Column(Float, default=0.0)
    total_withdraw = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    task_unit_id = Column(Integer, ForeignKey("task_units.id"))
    type = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    balance_before = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    wallet = relationship("Wallet", back_populates="transactions")


class TaskBatch(Base):
    __tablename__ = "task_batches"

    id = Column(Integer, primary_key=True, index=True)
    publisher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    batch_name = Column(String(200), nullable=False)
    description = Column(Text)
    total_units = Column(Integer, default=0)
    completed_units = Column(Integer, default=0)
    unit_reward = Column(Float, default=0.0)
    total_reward = Column(Float, default=0.0)
    requirements = Column(Text)
    min_worker_level = Column(Integer, default=1)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING)
    import_file_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    publisher = relationship("User", back_populates="published_batches")
    task_units = relationship("TaskUnit", back_populates="batch")


class TaskUnit(Base):
    __tablename__ = "task_units"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("task_batches.id"), nullable=False)
    unit_index = Column(Integer, nullable=False)
    task_data = Column(Text, nullable=False)
    reward = Column(Float, default=0.0)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    min_worker_level = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batch = relationship("TaskBatch", back_populates="task_units")
    assignment = relationship("TaskAssignment", back_populates="task_unit", uselist=False)
    delivery = relationship("TaskDelivery", back_populates="task_unit", uselist=False)
    anti_cheating = relationship("AntiCheatingRecord", back_populates="task_unit", uselist=False)
    reviews = relationship("ExpertReview", back_populates="task_unit")
    settlement = relationship("SettlementRecord", back_populates="task_unit", uselist=False)
    appeal = relationship("Appeal", back_populates="task_unit", uselist=False)
    operations = relationship("OperationTrace", back_populates="task_unit")


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    task_unit_id = Column(Integer, ForeignKey("task_units.id"), unique=True, nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    deadline_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

    task_unit = relationship("TaskUnit", back_populates="assignment")
    worker = relationship("User", back_populates="assigned_tasks")


class TaskDelivery(Base):
    __tablename__ = "task_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    task_unit_id = Column(Integer, ForeignKey("task_units.id"), unique=True, nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    delivery_data = Column(Text, nullable=False)
    ip_address = Column(String(50))
    device_fingerprint = Column(String(255))
    delivered_at = Column(DateTime, default=datetime.utcnow)
    version = Column(Integer, default=1)

    task_unit = relationship("TaskUnit", back_populates="delivery")


class AntiCheatingRecord(Base):
    __tablename__ = "anti_cheating_records"

    id = Column(Integer, primary_key=True, index=True)
    task_unit_id = Column(Integer, ForeignKey("task_units.id"), unique=True, nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String(50))
    device_fingerprint = Column(String(255))
    ip_risk_score = Column(Float, default=0.0)
    fingerprint_risk_score = Column(Float, default=0.0)
    total_risk_score = Column(Float, default=0.0)
    risk_level = Column(SQLEnum(CheatingRiskLevel), default=CheatingRiskLevel.LOW)
    risk_factors = Column(Text)
    is_flagged = Column(Boolean, default=False)
    checked_at = Column(DateTime, default=datetime.utcnow)

    task_unit = relationship("TaskUnit", back_populates="anti_cheating")


class ExpertReview(Base):
    __tablename__ = "expert_reviews"

    id = Column(Integer, primary_key=True, index=True)
    task_unit_id = Column(Integer, ForeignKey("task_units.id"), nullable=False)
    expert_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_blind = Column(Boolean, default=True)
    result = Column(SQLEnum(ReviewResult), default=ReviewResult.PENDING)
    score = Column(Float)
    comments = Column(Text)
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    task_unit = relationship("TaskUnit", back_populates="reviews")
    expert = relationship("User", back_populates="reviews")


class SettlementRecord(Base):
    __tablename__ = "settlement_records"

    id = Column(Integer, primary_key=True, index=True)
    task_unit_id = Column(Integer, ForeignKey("task_units.id"), unique=True, nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    report_reference = Column(String(100))
    settled_at = Column(DateTime, default=datetime.utcnow)

    task_unit = relationship("TaskUnit", back_populates="settlement")


class Appeal(Base):
    __tablename__ = "appeals"

    id = Column(Integer, primary_key=True, index=True)
    task_unit_id = Column(Integer, ForeignKey("task_units.id"), unique=True, nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    evidence = Column(Text)
    status = Column(SQLEnum(AppealStatus), default=AppealStatus.PENDING)
    admin_id = Column(Integer, ForeignKey("users.id"))
    admin_comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)

    task_unit = relationship("TaskUnit", back_populates="appeal")
    requester = relationship("User", back_populates="appeals", foreign_keys=[requester_id])


class OperationTrace(Base):
    __tablename__ = "operation_traces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    task_unit_id = Column(Integer, ForeignKey("task_units.id"))
    operation = Column(String(100), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    version = Column(Integer, default=1)

    user = relationship("User", back_populates="operations")
    task_unit = relationship("TaskUnit", back_populates="operations")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    resource = Column(String(100))
    resource_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


Index("idx_task_status_updated", TaskUnit.status, TaskUnit.updated_at)
Index("idx_assignment_worker_active", TaskAssignment.worker_id, TaskAssignment.is_active)
