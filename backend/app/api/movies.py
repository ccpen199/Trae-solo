from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Movie
from app.schemas import MovieResponse, MovieDetailResponse, MovieListResponse, ApiResponse

router = APIRouter()

@router.get("", response_model=ApiResponse[MovieListResponse])
async def get_movies(
    status: Optional[str] = Query("showing", description="showing=热映, coming=即将上映"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Movie).filter(Movie.status == status)
    total = query.count()
    movies = query.order_by(Movie.is_hot.desc(), Movie.rating.desc()) \
        .offset((page - 1) * page_size).limit(page_size).all()
    
    return ApiResponse(data=MovieListResponse(
        total=total,
        items=[MovieResponse.model_validate(m) for m in movies]
    ))

@router.get("/{movie_id}", response_model=ApiResponse[MovieDetailResponse])
async def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        return ApiResponse(code=404, message="电影不存在")
    return ApiResponse(data=MovieDetailResponse.model_validate(movie))
