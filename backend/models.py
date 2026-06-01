from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), nullable=False)
    department = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    created_documents = relationship("Document", back_populates="creator", foreign_keys="Document.created_by")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="Task.assigned_to")
    audit_logs = relationship("AuditLog", back_populates="operator")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50))
    version = Column(String(20), default="1.0")
    status = Column(String(20), default="pending")
    permission_scope = Column(String(50))
    source = Column(String(100))
    file_path = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    is_deprecated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    creator = relationship("User", back_populates="created_documents", foreign_keys=[created_by])
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="document")
    audit_logs = relationship("AuditLog", back_populates="document")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Text)
    token_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    document = relationship("Document", back_populates="chunks")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="pending")
    priority = Column(String(20), default="medium")
    question = Column(Text)
    answer = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    previous_node = Column(Integer, ForeignKey("tasks.id"))
    rule_version = Column(String(20))
    required_materials = Column(JSON)
    exception_reason = Column(String(500))
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    citations = relationship("Citation", back_populates="task", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="task", cascade="all, delete-orphan")

class Citation(Base):
    __tablename__ = "citations"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_id = Column(Integer, ForeignKey("document_chunks.id"))
    quote_text = Column(Text, nullable=False)
    similarity_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    task = relationship("Task", back_populates="citations")
    document = relationship("Document", back_populates="citations")

class StatusHistory(Base):
    __tablename__ = "status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    from_status = Column(String(20))
    to_status = Column(String(20), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"))
    remark = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    task = relationship("Task", back_populates="status_history")

class ExceptionLog(Base):
    __tablename__ = "exception_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    operation_type = Column(String(50), nullable=False)
    original_request = Column(JSON)
    error_message = Column(Text, nullable=False)
    error_stack = Column(Text)
    compensation_action = Column(String(200))
    manual_note = Column(Text)
    resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operation_type = Column(String(50), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"))
    details = Column(JSON)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    operator = relationship("User", back_populates="audit_logs")
    document = relationship("Document", back_populates="audit_logs")

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer)
    comment = Column(Text)
    is_correct = Column(Boolean)
    correction_suggestion = Column(Text)
    collected = Column(Boolean, default=False)
    collected_by = Column(Integer, ForeignKey("users.id"))
    collected_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RuleConfig(Base):
    __tablename__ = "rule_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_type = Column(String(50), nullable=False)
    version = Column(String(20), nullable=False)
    content = Column(JSON, nullable=False)
    description = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
