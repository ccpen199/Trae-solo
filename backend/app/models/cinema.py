from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Cinema(Base):
    __tablename__ = "cinemas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    address = Column(String(500))
    city_id = Column(Integer, ForeignKey("cities.id"))
    city_name = Column(String(100))
    phone = Column(String(50))
    business_hours = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    facilities = Column(String(500))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
