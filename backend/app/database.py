from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from app.config import settings
import os

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    data_dir = os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", ""))
    if data_dir and not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)
    Base.metadata.create_all(bind=engine)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100))
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    forms = relationship("FormDefinition", back_populates="creator")
    submissions = relationship("FormSubmission", back_populates="user")
    audits = relationship("AuditLog", back_populates="user")


class FormDefinition(Base):
    __tablename__ = "form_definitions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True)
    description = Column(Text)
    status = Column(String(20), default="draft")
    schema_json = Column(JSON)
    table_name = Column(String(100))
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime)
    version = Column(Integer, default=1)
    
    creator = relationship("User", back_populates="forms")
    submissions = relationship("FormSubmission", back_populates="form")
    logics = relationship("FormLogic", back_populates="form")
    fields = relationship("FormField", back_populates="form")


class FormField(Base):
    __tablename__ = "form_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("form_definitions.id"))
    field_name = Column(String(100))
    field_label = Column(String(100))
    field_type = Column(String(50))
    column_type = Column(String(50))
    is_required = Column(Boolean, default=False)
    is_unique = Column(Boolean, default=False)
    default_value = Column(Text)
    validation_rules = Column(JSON)
    options = Column(JSON)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    form = relationship("FormDefinition", back_populates="fields")


class FormLogic(Base):
    __tablename__ = "form_logics"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("form_definitions.id"))
    logic_type = Column(String(50))
    name = Column(String(100))
    dsl_code = Column(Text)
    ast_json = Column(JSON)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    form = relationship("FormDefinition", back_populates="logics")


class FormSubmission(Base):
    __tablename__ = "form_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("form_definitions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    submission_data = Column(JSON)
    status = Column(String(20), default="pending")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = Column(DateTime)
    signature = Column(String(255))
    
    form = relationship("FormDefinition", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
    histories = relationship("SubmissionHistory", back_populates="submission")


class SubmissionHistory(Base):
    __tablename__ = "submission_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("form_submissions.id"))
    version = Column(Integer)
    data_snapshot = Column(JSON)
    status = Column(String(20))
    change_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    submission = relationship("FormSubmission", back_populates="histories")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50))
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(50))
    user_agent = Column(String(255))
    signature = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="audits")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200))
    content = Column(Text)
    notification_type = Column(String(50))
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)


class ReportTask(Base):
    __tablename__ = "report_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("form_definitions.id"))
    report_type = Column(String(50))
    parameters = Column(JSON)
    status = Column(String(20), default="pending")
    file_path = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)


class StateTransition(Base):
    __tablename__ = "state_transitions"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    from_state = Column(String(50))
    to_state = Column(String(50))
    trigger = Column(String(100))
    details = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
