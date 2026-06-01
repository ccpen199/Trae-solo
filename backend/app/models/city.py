from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    province = Column(String(50))
    latitude = Column(Float)
    longitude = Column(Float)
    is_hot = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
