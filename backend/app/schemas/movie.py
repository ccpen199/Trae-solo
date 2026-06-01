from pydantic import BaseModel
from typing import List
from datetime import date

class MovieResponse(BaseModel):
    id: int
    title: str
    original_title: str | None = None
    poster: str | None = None
    rating: float = 0.0
    genres: str | None = None
    duration: int | None = None
    release_date: date | None = None
    status: str = "showing"

    class Config:
        from_attributes = True

class MovieDetailResponse(MovieResponse):
    backdrop: str | None = None
    rating_count: int = 0
    country: str | None = None
    language: str | None = None
    director: str | None = None
    cast: str | None = None
    synopsis: str | None = None

class MovieListResponse(BaseModel):
    total: int
    items: List[MovieResponse]
