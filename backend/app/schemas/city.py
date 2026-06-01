from pydantic import BaseModel
from typing import List

class CityResponse(BaseModel):
    id: int
    name: str
    province: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_hot: bool = False

    class Config:
        from_attributes = True

class CityListResponse(BaseModel):
    hot_cities: List[CityResponse]
    all_cities: List[CityResponse]
