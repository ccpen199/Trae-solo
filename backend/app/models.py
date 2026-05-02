from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(50), nullable=False)
    id_card = Column(String(18), unique=True, index=True)
    phone = Column(String(20))
    role = Column(String(20), nullable=False)
    department = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cases = relationship("Case", back_populates="citizen")
    created_actions = relationship("ActionLog", back_populates="operator", foreign_keys="ActionLog.operator_id")


class ServiceItem(Base):
    __tablename__ = "service_items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, index=True, nullable=False)
    item_name = Column(String(200), nullable=False)
    item_type = Column(String(50))
    department = Column(String(100), nullable=False)
    description = Column(Text)
    required_materials = Column(JSON, default=list)
    sample_forms = Column(JSON, default=list)
    handling_time_limit = Column(Integer, default=10)
    window_count = Column(Integer, default=3)
    daily_quota = Column(Integer, default=50)
    is_online = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cases = relationship("Case", back_populates="service_item")
    time_slots = relationship("TimeSlot", back_populates="service_item")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(30), unique=True, index=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_item_id = Column(Integer, ForeignKey("service_items.id"), nullable=False)
    status = Column(String(30), default="DRAFT", nullable=False)
    current_step = Column(Integer, default=1)
    application_data = Column(JSON, default=dict)
    remark = Column(Text)
    is_urgent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)

    citizen = relationship("User", back_populates="cases")
    service_item = relationship("ServiceItem", back_populates="cases")
    materials = relationship("CaseMaterial", back_populates="case_obj", cascade="all, delete-orphan")
    audits = relationship("AuditRecord", back_populates="case_obj", cascade="all, delete-orphan")
    reservation = relationship("Reservation", back_populates="case_obj", uselist=False)
    evaluation = relationship("Evaluation", back_populates="case_obj", uselist=False)
    status_histories = relationship("StatusHistory", back_populates="case_obj", cascade="all, delete-orphan")
    action_logs = relationship("ActionLog", back_populates="case_obj", cascade="all, delete-orphan")
    queue_number = relationship("QueueNumber", back_populates="case_obj", uselist=False)


class CaseMaterial(Base):
    __tablename__ = "case_materials"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    material_name = Column(String(200), nullable=False)
    material_type = Column(String(50))
    file_path = Column(String(500))
    file_name = Column(String(200))
    file_size = Column(Integer)
    ocr_result = Column(JSON)
    ocr_status = Column(String(20), default="PENDING")
    ocr_confidence = Column(Float)
    is_verified = Column(Boolean, default=False)
    verification_remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    case_obj = relationship("Case", back_populates="materials")


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    auditor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("case_materials.id"))
    audit_type = Column(String(30), nullable=False)
    audit_result = Column(String(20), nullable=False)
    audit_opinion = Column(Text)
    correction_suggestion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    case_obj = relationship("Case", back_populates="audits")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    service_item_id = Column(Integer, ForeignKey("service_items.id"), nullable=False)
    window_number = Column(Integer, nullable=False)
    date = Column(String(20), nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    total_capacity = Column(Integer, default=10)
    used_capacity = Column(Integer, default=0)
    status = Column(String(20), default="AVAILABLE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    service_item = relationship("ServiceItem", back_populates="time_slots")
    reservations = relationship("Reservation", back_populates="time_slot")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    reservation_number = Column(String(30), unique=True, index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="CONFIRMED")
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    case_obj = relationship("Case", back_populates="reservation")
    time_slot = relationship("TimeSlot", back_populates="reservations")


class QueueNumber(Base):
    __tablename__ = "queue_numbers"

    id = Column(Integer, primary_key=True, index=True)
    queue_code = Column(String(20), unique=True, index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id"))
    window_number = Column(Integer)
    status = Column(String(20), default="WAITING")
    called_at = Column(DateTime)
    served_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    case_obj = relationship("Case", back_populates="queue_number")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_score = Column(Integer, nullable=False)
    attitude_score = Column(Integer)
    efficiency_score = Column(Integer)
    environment_score = Column(Integer)
    comment = Column(Text)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    case_obj = relationship("Case", back_populates="evaluation")


class StatusHistory(Base):
    __tablename__ = "status_histories"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    from_status = Column(String(30))
    to_status = Column(String(30), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator_role = Column(String(20))
    reason = Column(Text)
    snapshot_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    case_obj = relationship("Case", back_populates="status_histories")


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(50), nullable=False)
    action_name = Column(String(100), nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"))
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator_role = Column(String(20))
    target_type = Column(String(50))
    target_id = Column(Integer)
    before_data = Column(JSON)
    after_data = Column(JSON)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    case_obj = relationship("Case", back_populates="action_logs")
    operator = relationship("User", back_populates="created_actions", foreign_keys=[operator_id])
