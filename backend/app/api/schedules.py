from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.models import Schedule
from app.schemas import ApiResponse
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ScheduleResponse(BaseModel):
    id: int
    movie_id: int
    cinema_id: int
    show_date: date
    start_time: str
    end_time: str | None = None
    hall_name: str | None = None
    language: str | None = None
    version: str | None = None
    price: float = 0.0
    available_seats: int = 0

    class Config:
        from_attributes = True

@router.get("", response_model=ApiResponse[List[ScheduleResponse]])
async def get_schedules(
    city_id: Optional[int] = Query(None),
    movie_id: Optional[int] = Query(None),
    cinema_id: Optional[int] = Query(None),
    show_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Schedule)
    if movie_id:
        query = query.filter(Schedule.movie_id == movie_id)
    if cinema_id:
        query = query.filter(Schedule.cinema_id == cinema_id)
    if show_date:
        query = query.filter(Schedule.show_date == show_date)
    
    schedules = query.order_by(Schedule.start_time).all()
    
    result = []
    for s in schedules:
        result.append(ScheduleResponse(
            id=s.id,
            movie_id=s.movie_id,
            cinema_id=s.cinema_id,
            show_date=s.show_date,
            start_time=str(s.start_time),
            end_time=str(s.end_time) if s.end_time else None,
            hall_name=s.hall_name,
            language=s.language,
            version=s.version,
            price=s.price,
            available_seats=s.available_seats
        ))
    
    return ApiResponse(data=result)
