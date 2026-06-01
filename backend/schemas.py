from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    version: str = "1.0"
    permission_scope: Optional[str] = None
    source: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = None
    permission_scope: Optional[str] = None
    is_deprecated: Optional[bool] = None

class DocumentResponse(DocumentBase):
    id: int
    status: str
    created_by: Optional[int]
    approved_by: Optional[int]
    is_deprecated: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    similarity_score: Optional[float] = None

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    task_type: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    question: Optional[str] = None
    answer: Optional[str] = None

class TaskCreate(TaskBase):
    assigned_to: Optional[int] = None
    previous_node: Optional[int] = None
    required_materials: Optional[dict] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    answer: Optional[str] = None
    exception_reason: Optional[str] = None
    feedback: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    status: str
    assigned_to: Optional[int]
    previous_node: Optional[int]
    rule_version: Optional[str]
    exception_reason: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class CitationBase(BaseModel):
    document_id: int
    chunk_id: Optional[int] = None
    quote_text: str
    similarity_score: Optional[float] = None

class CitationCreate(CitationBase):
    task_id: int

class CitationResponse(CitationBase):
    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class StatusHistoryResponse(BaseModel):
    id: int
    task_id: int
    from_status: Optional[str]
    to_status: str
    operator_id: Optional[int]
    remark: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ExceptionLogBase(BaseModel):
    task_id: Optional[int] = None
    operation_type: str
    original_request: Optional[dict] = None
    error_message: str
    error_stack: Optional[str] = None
    compensation_action: Optional[str] = None

class ExceptionLogCreate(ExceptionLogBase):
    pass

class ExceptionLogResponse(ExceptionLogBase):
    id: int
    resolved: bool
    manual_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackBase(BaseModel):
    task_id: int
    rating: Optional[int] = None
    comment: Optional[str] = None
    is_correct: Optional[bool] = None
    correction_suggestion: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackResponse(FeedbackBase):
    id: int
    user_id: int
    collected: bool
    created_at: datetime

    class Config:
        from_attributes = True

class QARequest(BaseModel):
    question: str
    context_filter: Optional[dict] = None

class QAResponse(BaseModel):
    question: str
    answer: str
    citations: List[CitationResponse]
    task_id: int
    sources: List[dict]

class RuleConfigBase(BaseModel):
    rule_type: str
    version: str
    content: dict
    description: Optional[str] = None

class RuleConfigCreate(RuleConfigBase):
    pass

class RuleConfigResponse(RuleConfigBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    operator_id: Optional[int]
    operation_type: str
    document_id: Optional[int]
    task_id: Optional[int]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class TaskWithDetails(TaskResponse):
    assignee: Optional[UserResponse] = None
    citations: List[CitationResponse] = []
    status_history: List[StatusHistoryResponse] = []
    document: Optional[DocumentResponse] = None
