from sqlalchemy import Column, Integer, String, Text, Date, Float, Boolean, DateTime
from datetime import datetime
from app.database import Base

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    original_title = Column(String(200))
    poster = Column(String(500))
    backdrop = Column(String(500))
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    genres = Column(String(200))
    duration = Column(Integer)
    release_date = Column(Date)
    country = Column(String(100))
    language = Column(String(100))
    director = Column(String(200))
    cast = Column(Text)
    synopsis = Column(Text)
    status = Column(String(20), default="showing")
    is_hot = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
