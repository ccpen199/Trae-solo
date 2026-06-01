from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Time, ForeignKey
from datetime import datetime
from app.database import Base

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"))
    cinema_id = Column(Integer, ForeignKey("cinemas.id"))
    show_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time)
    hall_name = Column(String(100))
    language = Column(String(50))
    version = Column(String(50))
    price = Column(Float, default=0.0)
    available_seats = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)
