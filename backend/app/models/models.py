from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Table,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    VOLUNTEER = "volunteer"
    ORGANIZER = "organizer"
    ADMIN = "admin"
    REVIEWER = "reviewer"


class ActivityStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    RECRUITING = "recruiting"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ShiftStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class AttendanceStatus(str, enum.Enum):
    PENDING = "pending"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    ABSENT = "absent"
    ANOMALY = "anomaly"


class BadgeTier(str, enum.Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class AnomalyType(str, enum.Enum):
    EARLY_LEAVE = "early_leave"
    LATE_ARRIVAL = "late_arrival"
    LOCATION_MISMATCH = "location_mismatch"
    SUSPICIOUS_DURATION = "suspicious_duration"
    DATA_FRAUD = "data_fraud"


user_skill = Table(
    "user_skill",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)

activity_skill = Table(
    "activity_skill",
    Base.metadata,
    Column("activity_id", Integer, ForeignKey("activities.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.VOLUNTEER, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    credit_score: Mapped[int] = mapped_column(Integer, default=100)
    total_service_hours: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    skills: Mapped[List["Skill"]] = relationship("Skill", secondary=user_skill, back_populates="users")
    registrations: Mapped[List["Registration"]] = relationship(
        "Registration", 
        foreign_keys="[Registration.volunteer_id]",
        back_populates="volunteer"
    )
    shifts: Mapped[List["Shift"]] = relationship("Shift", back_populates="volunteer")
    attendances: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="volunteer")
    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="volunteer")
    credit_records: Mapped[List["CreditRecord"]] = relationship("CreditRecord", back_populates="user")
    user_badges: Mapped[List["UserBadge"]] = relationship(
        "UserBadge", 
        foreign_keys="[UserBadge.user_id]",
        back_populates="user"
    )
    organized_activities: Mapped[List["Activity"]] = relationship("Activity", back_populates="organizer")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[List["User"]] = relationship("User", secondary=user_skill, back_populates="skills")
    activities: Mapped[List["Activity"]] = relationship("Activity", secondary=activity_skill, back_populates="required_skills")


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    organizer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[ActivityStatus] = mapped_column(
        SQLEnum(ActivityStatus),
        default=ActivityStatus.DRAFT,
        index=True,
    )
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    location_radius: Mapped[float] = mapped_column(Float, default=200.0)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    max_volunteers: Mapped[int] = mapped_column(Integer, default=10)
    current_volunteers: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organizer: Mapped["User"] = relationship("User", back_populates="organized_activities")
    required_skills: Mapped[List["Skill"]] = relationship("Skill", secondary=activity_skill, back_populates="activities")
    registrations: Mapped[List["Registration"]] = relationship("Registration", back_populates="activity")
    shifts: Mapped[List["Shift"]] = relationship("Shift", back_populates="activity")
    attendances: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="activity")
    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="activity")


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    volunteer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("activities.id"), nullable=False)
    status: Mapped[RegistrationStatus] = mapped_column(
        SQLEnum(RegistrationStatus),
        default=RegistrationStatus.PENDING,
        index=True,
    )
    message: Mapped[Optional[str]] = mapped_column(Text)
    reviewed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    volunteer: Mapped["User"] = relationship(
        "User", 
        foreign_keys=[volunteer_id],
        back_populates="registrations"
    )
    activity: Mapped["Activity"] = relationship("Activity", back_populates="registrations")


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("activities.id"), nullable=False)
    volunteer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    registration_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("registrations.id"))
    status: Mapped[ShiftStatus] = mapped_column(
        SQLEnum(ShiftStatus),
        default=ShiftStatus.PENDING,
        index=True,
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    activity: Mapped["Activity"] = relationship("Activity", back_populates="shifts")
    volunteer: Mapped["User"] = relationship("User", back_populates="shifts")
    attendance: Mapped[Optional["Attendance"]] = relationship("Attendance", back_populates="shift", uselist=False)
    work_order: Mapped[Optional["WorkOrder"]] = relationship("WorkOrder", back_populates="shift", uselist=False)


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shift_id: Mapped[int] = mapped_column(Integer, ForeignKey("shifts.id"), nullable=False)
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("activities.id"), nullable=False)
    volunteer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    order_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    tasks: Mapped[str] = mapped_column(Text, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    shift: Mapped["Shift"] = relationship("Shift", back_populates="work_order")
    activity: Mapped["Activity"] = relationship("Activity", back_populates="work_orders")
    volunteer: Mapped["User"] = relationship("User", back_populates="work_orders")


class Attendance(Base):
    __tablename__ = "attendances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shift_id: Mapped[int] = mapped_column(Integer, ForeignKey("shifts.id"), nullable=False)
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("activities.id"), nullable=False)
    volunteer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[AttendanceStatus] = mapped_column(
        SQLEnum(AttendanceStatus),
        default=AttendanceStatus.PENDING,
        index=True,
    )
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    check_in_latitude: Mapped[Optional[float]] = mapped_column(Float)
    check_in_longitude: Mapped[Optional[float]] = mapped_column(Float)
    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    check_out_latitude: Mapped[Optional[float]] = mapped_column(Float)
    check_out_longitude: Mapped[Optional[float]] = mapped_column(Float)
    actual_duration: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shift: Mapped["Shift"] = relationship("Shift", back_populates="attendance")
    activity: Mapped["Activity"] = relationship("Activity", back_populates="attendances")
    volunteer: Mapped["User"] = relationship("User", back_populates="attendances")
    anomalies: Mapped[List["AnomalyRecord"]] = relationship("AnomalyRecord", back_populates="attendance")


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tier: Mapped[BadgeTier] = mapped_column(SQLEnum(BadgeTier), default=BadgeTier.BRONZE)
    icon: Mapped[Optional[str]] = mapped_column(String(200))
    requirement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    requirement_value: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user_badges: Mapped[List["UserBadge"]] = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id: Mapped[int] = mapped_column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    awarded_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    reason: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped["User"] = relationship(
        "User", 
        foreign_keys=[user_id],
        back_populates="user_badges"
    )
    badge: Mapped["Badge"] = relationship("Badge", back_populates="user_badges")


class CreditRecord(Base):
    __tablename__ = "credit_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    activity_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("activities.id"))
    attendance_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("attendances.id"))
    change: Mapped[int] = mapped_column(Integer, nullable=False)
    balance: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="credit_records")


class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attendance_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("attendances.id"))
    activity_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("activities.id"))
    volunteer_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    anomaly_type: Mapped[AnomalyType] = mapped_column(SQLEnum(AnomalyType), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    action_taken: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    attendance: Mapped[Optional["Attendance"]] = relationship("Attendance", back_populates="anomalies")


class ServiceHeat(Base):
    __tablename__ = "service_heat"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    hour: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    total_activities: Mapped[int] = mapped_column(Integer, default=0)
    total_volunteers: Mapped[int] = mapped_column(Integer, default=0)
    total_hours: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    table_name: Mapped[Optional[str]] = mapped_column(String(50))
    record_id: Mapped[Optional[int]] = mapped_column(Integer)
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))
    user_agent: Mapped[Optional[str]] = mapped_column(String(255))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    notification_type: Mapped[str] = mapped_column(String(50), index=True)
    related_id: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
