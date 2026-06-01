from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: str
    role: Optional[str] = "jobseeker"


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeUploadResponse(BaseModel):
    id: int
    file_name: str
    skills: List[str]
    projects: List[Dict[str, Any]]
    soft_skills: List[str]
    radar_data: Dict[str, Any]
    ai_generated_score: float
    anticheat_flags: List[Dict[str, Any]]


class InterviewQuestion(BaseModel):
    id: int
    question: str
    type: str
    difficulty: str


class InterviewStartRequest(BaseModel):
    job_title: str
    jd_content: str
    job_id: Optional[int] = None


class InterviewAnswerRequest(BaseModel):
    question_id: int
    answer: str


class InterviewEvaluateResponse(BaseModel):
    logic_score: float
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]


class CareerPlanRequest(BaseModel):
    current_position: str
    target_position: str
    current_skills: List[str]


class CareerPlanResponse(BaseModel):
    skill_gaps: List[Dict[str, Any]]
    learning_resources: List[Dict[str, Any]]
    roadmap: List[Dict[str, Any]]


class TalentSearchRequest(BaseModel):
    query: str
    company_id: Optional[int] = 1
    limit: Optional[int] = 20


class TalentMatch(BaseModel):
    resume_id: int
    candidate_name: str
    match_score: float
    skills_match: List[str]
    highlight_projects: List[str]
    brief_summary: str


class MessageSendRequest(BaseModel):
    receiver_id: int
    content: str


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
