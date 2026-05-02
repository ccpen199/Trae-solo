from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.models import (
    UserRole,
    ActivityStatus,
    RegistrationStatus,
    ShiftStatus,
    AttendanceStatus,
    BadgeTier,
    AnomalyType,
)


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.VOLUNTEER


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    phone: Optional[str]
    full_name: str
    role: UserRole
    is_active: bool
    credit_score: int
    total_service_hours: float
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None


class SkillBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = None
    category: str = Field(..., max_length=50)


class SkillResponse(SkillBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(...)
    location: str = Field(..., max_length=200)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_radius: float = 200.0
    start_time: datetime
    end_time: datetime
    max_volunteers: int = 10
    required_skill_ids: List[int] = []


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_radius: Optional[float] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_volunteers: Optional[int] = None
    status: Optional[ActivityStatus] = None


class ActivityResponse(ActivityBase):
    id: int
    organizer_id: int
    status: ActivityStatus
    current_volunteers: int
    created_at: datetime
    updated_at: datetime
    required_skills: List[SkillResponse] = []

    class Config:
        from_attributes = True


class RegistrationBase(BaseModel):
    activity_id: int
    message: Optional[str] = None


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationResponse(BaseModel):
    id: int
    volunteer_id: int
    activity_id: int
    status: RegistrationStatus
    message: Optional[str]
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RegistrationReview(BaseModel):
    status: RegistrationStatus
    message: Optional[str] = None


class ShiftBase(BaseModel):
    activity_id: int
    volunteer_id: int
    start_time: datetime
    end_time: datetime


class ShiftResponse(BaseModel):
    id: int
    activity_id: int
    volunteer_id: int
    registration_id: Optional[int]
    status: ShiftStatus
    start_time: datetime
    end_time: datetime
    confirmed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkOrderResponse(BaseModel):
    id: int
    shift_id: int
    activity_id: int
    volunteer_id: int
    order_code: str
    tasks: str
    issued_at: datetime

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    shift_id: int
    latitude: float
    longitude: float


class AttendanceResponse(BaseModel):
    id: int
    shift_id: int
    activity_id: int
    volunteer_id: int
    status: AttendanceStatus
    check_in_time: Optional[datetime]
    check_in_latitude: Optional[float]
    check_in_longitude: Optional[float]
    check_out_time: Optional[datetime]
    check_out_latitude: Optional[float]
    check_out_longitude: Optional[float]
    actual_duration: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    tier: BadgeTier
    icon: Optional[str]
    requirement_type: str
    requirement_value: int

    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    id: int
    user_id: int
    badge_id: int
    awarded_at: datetime
    awarded_by: Optional[int]
    reason: Optional[str]
    badge: BadgeResponse

    class Config:
        from_attributes = True


class CreditRecordResponse(BaseModel):
    id: int
    user_id: int
    activity_id: Optional[int]
    attendance_id: Optional[int]
    change: int
    balance: int
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


class AnomalyRecordResponse(BaseModel):
    id: int
    attendance_id: Optional[int]
    activity_id: Optional[int]
    volunteer_id: Optional[int]
    anomaly_type: AnomalyType
    description: str
    is_verified: bool
    verified_by: Optional[int]
    verified_at: Optional[datetime]
    action_taken: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceHeatResponse(BaseModel):
    id: int
    date: datetime
    hour: int
    total_activities: int
    total_volunteers: int
    total_hours: float
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    table_name: Optional[str]
    record_id: Optional[int]
    old_value: Optional[str]
    new_value: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    read_at: Optional[datetime]
    notification_type: str
    related_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class APIResponse(BaseModel):
    success: bool = True
    message: str = "操作成功"
    data: Optional[dict] = None


class IncentiveResponse(BaseModel):
    credit_change: int
    previous_balance: int
    new_balance: int
    hours_added: float
    awarded_badges: List[str]
