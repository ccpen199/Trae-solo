from typing import Optional
from enum import Enum
from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, UIDMixin


class UserRole(str, Enum):
    FARMER = "farmer"
    QUALITY_INSPECTOR = "quality_inspector"
    WAREHOUSE_MANAGER = "warehouse_manager"
    LOGISTICS_OPERATOR = "logistics_operator"
    CONSUMER = "consumer"
    ADMIN = "admin"


class User(Base, TimestampMixin, UIDMixin):
    __tablename__ = "users"
    
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    real_name: Mapped[Optional[str]] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(100))
    
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), nullable=False, default=UserRole.FARMER)
    
    organization: Mapped[Optional[str]] = mapped_column(String(200))
    organization_uid: Mapped[Optional[str]] = mapped_column(String(36), index=True)
    
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role.value})>"
