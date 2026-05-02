import os
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./data/app.sqlite"
    BACKEND_PORT: int = 21127
    FRONTEND_PORT: int = 11271
    FRONTEND_URL: str = "http://localhost:11271"
    BACKEND_URL: str = "http://localhost:21127"
    SECRET_KEY: str = "crowdsourcing-platform-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
