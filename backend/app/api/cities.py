from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import City
from app.schemas import CityResponse, CityListResponse, ApiResponse

router = APIRouter()

@router.get("", response_model=ApiResponse[CityListResponse])
async def get_cities(db: Session = Depends(get_db)):
    hot_cities = db.query(City).filter(City.is_hot == True).order_by(City.sort_order).all()
    all_cities = db.query(City).order_by(City.sort_order, City.name).all()
    
    return ApiResponse(data=CityListResponse(
        hot_cities=[CityResponse.model_validate(c) for c in hot_cities],
        all_cities=[CityResponse.model_validate(c) for c in all_cities]
    ))

@router.get("/{city_id}", response_model=ApiResponse[CityResponse])
async def get_city(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        return ApiResponse(code=404, message="城市不存在")
    return ApiResponse(data=CityResponse.model_validate(city))

@router.get("/locate/by-ip", response_model=ApiResponse[CityResponse])
async def locate_by_ip(db: Session = Depends(get_db)):
    city = db.query(City).filter(City.name == "北京").first()
    if city:
        return ApiResponse(data=CityResponse.model_validate(city))
    return ApiResponse(code=400, message="定位失败，请手动选择城市")
