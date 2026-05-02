import os
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "采购商城系统"
    ENV: str = "development"
    DEBUG: bool = True
    
    BACKEND_PORT: int = 21132
    FRONTEND_PORT: int = 11321
    
    DATABASE_URL: str = "sqlite:///./data/app.sqlite"
    
    SECRET_KEY: str = "purchase_mall_2024_secure_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    ALLOWED_ORIGINS: str = "http://localhost:11321,http://127.0.0.1:11321"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
