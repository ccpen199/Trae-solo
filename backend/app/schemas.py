from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


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


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    real_name: Optional[str] = None
    role: UserRole


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    real_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    phone: Optional[str]
    real_name: Optional[str]
    role: UserRole
    level: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: float
    total_income: float
    total_withdraw: float
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskBatchBase(BaseModel):
    batch_name: str
    description: Optional[str] = None
    unit_reward: float
    requirements: Optional[str] = None
    min_worker_level: int = 1


class TaskBatchCreate(TaskBatchBase):
    task_data_list: List[Any]


class TaskBatchResponse(BaseModel):
    id: int
    publisher_id: int
    batch_name: str
    description: Optional[str]
    total_units: int
    completed_units: int
    unit_reward: float
    total_reward: float
    requirements: Optional[str]
    min_worker_level: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskUnitResponse(BaseModel):
    id: int
    batch_id: int
    unit_index: int
    task_data: Any
    reward: float
    status: TaskStatus
    min_worker_level: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskDeliveryCreate(BaseModel):
    task_unit_id: int
    delivery_data: Any
    device_fingerprint: Optional[str] = None


class TaskDeliveryResponse(BaseModel):
    id: int
    task_unit_id: int
    worker_id: int
    delivery_data: Any
    ip_address: Optional[str]
    device_fingerprint: Optional[str]
    delivered_at: datetime
    version: int

    class Config:
        from_attributes = True


class AntiCheatingResponse(BaseModel):
    id: int
    task_unit_id: int
    worker_id: int
    ip_address: Optional[str]
    device_fingerprint: Optional[str]
    ip_risk_score: float
    fingerprint_risk_score: float
    total_risk_score: float
    risk_level: CheatingRiskLevel
    risk_factors: Optional[str]
    is_flagged: bool
    checked_at: datetime

    class Config:
        from_attributes = True


class ExpertReviewCreate(BaseModel):
    task_unit_id: int
    result: ReviewResult
    score: Optional[float] = None
    comments: Optional[str] = None


class ExpertReviewResponse(BaseModel):
    id: int
    task_unit_id: int
    expert_id: int
    is_blind: bool
    result: ReviewResult
    score: Optional[float]
    comments: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SettlementResponse(BaseModel):
    id: int
    task_unit_id: int
    worker_id: int
    amount: float
    transaction_id: Optional[int]
    report_reference: Optional[str]
    settled_at: datetime

    class Config:
        from_attributes = True


class AppealCreate(BaseModel):
    task_unit_id: int
    reason: str
    evidence: Optional[str] = None


class AppealResolve(BaseModel):
    status: AppealStatus
    comments: str


class AppealResponse(BaseModel):
    id: int
    task_unit_id: int
    requester_id: int
    reason: str
    evidence: Optional[str]
    status: AppealStatus
    admin_id: Optional[int]
    admin_comments: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class OperationTraceResponse(BaseModel):
    id: int
    user_id: Optional[int]
    task_unit_id: Optional[int]
    operation: str
    old_value: Optional[str]
    new_value: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    version: int

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource: Optional[str]
    resource_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: int
    wallet_id: int
    task_unit_id: Optional[int]
    type: str
    amount: float
    balance_before: float
    balance_after: float
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class StatisticsResponse(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    settled_tasks: int
    total_reward: float
    total_settled: float
    total_users: int
    total_workers: int
    total_experts: int


class TaskAssignResponse(BaseModel):
    success: bool
    task_unit_id: int
    worker_id: int
    message: str
