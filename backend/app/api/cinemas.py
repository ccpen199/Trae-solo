from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Cinema
from app.schemas import CinemaResponse, CinemaListResponse, ApiResponse

router = APIRouter()

@router.get("", response_model=ApiResponse[CinemaListResponse])
async def get_cinemas(
    city_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Cinema)
    if city_id:
        query = query.filter(Cinema.city_id == city_id)
    
    total = query.count()
    cinemas = query.order_by(Cinema.id).offset((page - 1) * page_size).limit(page_size).all()
    
    return ApiResponse(data=CinemaListResponse(
        total=total,
        items=[CinemaResponse.model_validate(c) for c in cinemas]
    ))

@router.get("/{cinema_id}", response_model=ApiResponse[CinemaResponse])
async def get_cinema(cinema_id: int, db: Session = Depends(get_db)):
    cinema = db.query(Cinema).filter(Cinema.id == cinema_id).first()
    if not cinema:
        return ApiResponse(code=404, message="影院不存在")
    return ApiResponse(data=CinemaResponse.model_validate(cinema))
