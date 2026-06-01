from pydantic import BaseModel
from typing import List

class CinemaResponse(BaseModel):
    id: int
    name: str
    address: str | None = None
    city_id: int | None = None
    city_name: str | None = None
    phone: str | None = None
    business_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    facilities: str | None = None
    distance: float | None = None

    class Config:
        from_attributes = True

class CinemaListResponse(BaseModel):
    total: int
    items: List[CinemaResponse]
