from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(20), default="jobseeker")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resumes = relationship("Resume", back_populates="user")
    interviews = relationship("InterviewSession", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    companies = relationship("Company", back_populates="owner")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    description = Column(Text)
    industry = Column(String(100))
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="companies")
    jobs = relationship("Job", back_populates="company")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True)
    description = Column(Text)
    jd_content = Column(Text)
    requirements = Column(JSON)
    company_id = Column(Integer, ForeignKey("companies.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="jobs")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_name = Column(String(255))
    file_type = Column(String(50))
    raw_text = Column(Text)
    parsed_data = Column(JSON)
    skills = Column(JSON)
    projects = Column(JSON)
    soft_skills = Column(JSON)
    radar_data = Column(JSON)
    ai_generated_score = Column(Float, default=0.0)
    anticheat_flags = Column(JSON)
    is_valid = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="resumes")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    job_title = Column(String(200))
    jd_content = Column(Text)
    questions = Column(JSON)
    answers = Column(JSON)
    evaluation = Column(JSON)
    logic_score = Column(Float)
    status = Column(String(20), default="in_progress")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interviews")


class CareerPlan(Base):
    __tablename__ = "career_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    current_position = Column(String(200))
    target_position = Column(String(200))
    current_skills = Column(JSON)
    skill_gaps = Column(JSON)
    learning_resources = Column(JSON)
    roadmap = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class TalentSearch(Base):
    __tablename__ = "talent_searches"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    query = Column(String(500))
    matched_resume_ids = Column(JSON)
    candidate_briefs = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class AnticheatLog(Base):
    __tablename__ = "anticheat_logs"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    check_type = Column(String(50))
    severity = Column(String(20))
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    content_hash = Column(String(64), index=True)
    is_rate_limited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), index=True)
    event_data = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class TalentFlow(Base):
    __tablename__ = "talent_flow"

    id = Column(Integer, primary_key=True, index=True)
    source_industry = Column(String(100))
    target_industry = Column(String(100))
    count = Column(Integer, default=0)
    date = Column(DateTime, default=datetime.utcnow)


class SkillTrend(Base):
    __tablename__ = "skill_trends"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), index=True)
    demand_count = Column(Integer, default=0)
    date = Column(DateTime, default=datetime.utcnow)


class RecruitmentFunnel(Base):
    __tablename__ = "recruitment_funnels"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    impressions = Column(Integer, default=0)
    views = Column(Integer, default=0)
    applications = Column(Integer, default=0)
    interviews = Column(Integer, default=0)
    offers = Column(Integer, default=0)
    hires = Column(Integer, default=0)
    date = Column(DateTime, default=datetime.utcnow)
