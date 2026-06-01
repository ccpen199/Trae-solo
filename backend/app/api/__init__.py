from fastapi import APIRouter
from app.api import cities, movies, cinemas, schedules, users

api_router = APIRouter()

api_router.include_router(cities.router, prefix="/cities", tags=["cities"])
api_router.include_router(movies.router, prefix="/movies", tags=["movies"])
api_router.include_router(cinemas.router, prefix="/cinemas", tags=["cinemas"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
